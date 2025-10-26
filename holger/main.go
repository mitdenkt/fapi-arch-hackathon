package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hashicorp/go-memdb"
	"github.com/segmentio/kafka-go"
)

type Customer struct {
	Id        string `json:"id"`
	TenantId  string `json:"tenantId"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type Booking struct {
	Id          string `json:"id"`
	TenantId    string `json:"tenantId"`
	CustomerId  string `json:"customerId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Date        string `json:"date"`
	Status      string `json:"status"`
	Price       int    `json:"price"`
	Currency    string `json:"currency"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
	DateUnix    int
	DateShort   string
	Customer    Customer
}

func populate_bookings(db *memdb.MemDB, partition int) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:9092"},
		Topic:   "bookings",
		//GroupID:   "my-consumer-group",
		MinBytes:  10e3, // 10KB
		MaxBytes:  10e6, // 10MB
		Partition: partition,
	})
	defer r.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Consume messages

	for {
		msg, err := r.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				// Context cancelled, exit gracefully
				break
			}
			log.Printf("Error reading message: %v", err)
			continue
		}

		var booking Booking
		if err := json.Unmarshal(msg.Value, &booking); err == nil {
		} else {
			fmt.Printf("bookings unmarshal failed: %v\n", err)
		}
		booking.DateShort = booking.Date[:10]

		txn := db.Txn(true)
		if err := txn.Insert("bookings", booking); err != nil {
			panic(err)
		}
		txn.Commit()
		fmt.Printf("read")
	}
}

func populate_customer(db *memdb.MemDB, partition int) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:9092"},
		Topic:   "customer",
		//GroupID:   "my-consumer-group",
		MinBytes:  10e3, // 10KB
		MaxBytes:  10e6, // 10MB
		Partition: partition,
	})
	defer r.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Consume messages

	for {
		msg, err := r.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				// Context cancelled, exit gracefully
				break
			}
			log.Printf("Error reading message: %v", err)
			continue
		}

		var booking Customer
		if err := json.Unmarshal(msg.Value, &booking); err == nil {
		} else {
			fmt.Printf("bookings unmarshal failed: %v\n", err)
		}

		txn := db.Txn(true)
		if err := txn.Insert("customers", booking); err != nil {
			panic(err)
		}
		txn.Commit()
		fmt.Printf("read")
	}
}

func DateRange(start, end string) ([]string, error) {
	// Parse the date strings
	startDate, err := time.Parse("2006-01-02", start)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", end)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	// Create slice to hold dates
	var dates []string

	// Iterate from start to end (inclusive)
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		dates = append(dates, d.Format("2006-01-02"))
	}

	return dates, nil
}

func main() {
	// Create the DB schema

	booking_schema := &memdb.DBSchema{
		Tables: map[string]*memdb.TableSchema{
			"bookings": &memdb.TableSchema{
				Name: "bookings",
				Indexes: map[string]*memdb.IndexSchema{
					"id": {
						Name:    "id",
						Unique:  true,
						Indexer: &memdb.StringFieldIndex{Field: "Id"},
					},
					"dateShort": &memdb.IndexSchema{
						Name:    "dateShort",
						Unique:  false,
						Indexer: &memdb.StringFieldIndex{Field: "DateShort"},
					},
				},
			},
		},
	}

	customer_schema := &memdb.DBSchema{
		Tables: map[string]*memdb.TableSchema{
			"customers": {
				Name: "customers",
				Indexes: map[string]*memdb.IndexSchema{
					"id": {
						Name:    "id",
						Unique:  true,
						Indexer: &memdb.StringFieldIndex{Field: "Id"},
					},
				},
			},
		},
	}

	// Create a new data base
	booking_db, err := memdb.NewMemDB(booking_schema)
	if err != nil {
		panic(err)
	}
	customer_db, err := memdb.NewMemDB(customer_schema)
	if err != nil {
		panic(err)
	}

	for i := 0; i <= 127; i++ {
		p := i
		go populate_bookings(booking_db, p)
		go populate_customer(customer_db, p)
	}

	app := fiber.New(fiber.Config{
		// tuning options could go here for performance
	})

	/*cacheMiddleware := fiberCache.New(fiberCache.Config{
		Expiration: 30 * time.Second, // adjust TTL as needed
		// use path + query params so each date-range is cached separately
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.Path() + "|start=" + c.Query("start") + "|end=" + c.Query("end")
		},
	})*/

	app.Get("/api/bookings", func(c *fiber.Ctx) error {

		startParam := c.Query("start")
		endParam := c.Query("end")

		if startParam == "" || endParam == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing start or end query parameters (YYYY-MM-DD)",
			})
		}

		var result []Booking

		dates, _ := DateRange(startParam, endParam)

		ch := make(chan Booking)
		done := make(chan struct{})

		for _, date := range dates {
			d := date
			go func() {
				txn := booking_db.Txn(false)
				txn_customer := customer_db.Txn(false)
				defer txn.Abort()

				it, err := txn.Get("bookings", "dateShort", d)
				if err != nil {
					log.Printf("db get error for date %s: %v", d, err)
					done <- struct{}{}
					return
				}
				for obj := it.Next(); obj != nil; obj = it.Next() {
					bok := obj.(Booking)
					first, err := txn_customer.First("customers", "id", bok.CustomerId)
					if err != nil {
						return
					}
					bok.Customer = first.(Customer)
					ch <- bok
				}
				done <- struct{}{}
			}()
		}

		// close results channel when all workers finished
		go func() {
			for i := 0; i < len(dates); i++ {
				<-done
			}
			close(ch)
		}()

		for b := range ch {
			result = append(result, b)
		}

		fmt.Println(len(result))

		return c.Status(fiber.StatusOK).JSON(result)
	})

	// Start server
	addr := ":3334"
	fmt.Println("Listening on", addr)
	log.Fatal(app.Listen(addr))

}
