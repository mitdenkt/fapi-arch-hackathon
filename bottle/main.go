package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

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
}

type Customer struct {
	Id        string `json:"id"`
	TenantId  string `json:"tenantId"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func main() {
	bookingDataPath := "/Users/jamo/code/fapi-arch-hackathon/apps/data/output/APPC/booking.json"
	customerDataPath := "/Users/jamo/code/fapi-arch-hackathon/apps/data/output/APPC/customer.json"

	b, err := os.ReadFile(bookingDataPath)
	if err != nil {
		fmt.Printf("read file: %v\n", err)
		return
	}

	// Option B: decode into a generic map (use when shape is unknown)
	var bookings []Booking
	if err := json.Unmarshal(b, &bookings); err == nil {
	} else {
		fmt.Printf("bookings unmarshal failed: %v\n", err)
	}

	// configure logger
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	// build config map, enable broker debug when verbose
	config := kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092,localhost:9093,localhost:9094",
		"client.id":         "myProducer",
		"acks":              "all",
	}

	go func() {
		p, err := kafka.NewProducer(&config)
		if err != nil {
			log.Printf("Failed to create producer: %s\n", err)
			os.Exit(1)
		}
		defer p.Close()
		topic := "bookings"

		// larger buffer and a dedicated goroutine draining delivery reports
		deliveryChan := make(chan kafka.Event, 10000)
		go func() {
			for ev := range deliveryChan {
				if msg, ok := ev.(*kafka.Message); ok {
					if msg.TopicPartition.Error != nil {
						log.Printf("Delivery failed: %v\n", msg.TopicPartition.Error)
					} else {
						log.Printf("Message delivered to %v (len=%d)\n", msg.TopicPartition, len(msg.Value))
					}
				}
			}
		}()

		for i, element := range bookings {
			if i%10000 == 0 {
				fmt.Println("flushing")
				p.Flush(5000)
				fmt.Println("done flushing")
			}
			b, err := json.Marshal(element)
			if err != nil {
				fmt.Println(err)
				return
			}
			err = p.Produce(&kafka.Message{
				TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
				Value:          b,
				Key:            []byte(element.Id),
			}, deliveryChan)
			if err != nil {
				log.Printf("Failed to produce: %s\n", err)
				os.Exit(1)
			}
		}

		// ensure outstanding messages are delivered, then stop the drain goroutine
		p.Flush(1000)
		close(deliveryChan)
	}()

	go func() {
		p, err := kafka.NewProducer(&config)
		if err != nil {
			log.Printf("Failed to create producer: %s\n", err)
			os.Exit(1)
		}
		defer p.Close()
		b, err = os.ReadFile(customerDataPath)
		if err != nil {
			fmt.Printf("read file: %v\n", err)
			return
		}

		// Option B: decode into a generic map (use when shape is unknown)
		var customer []Customer
		if err := json.Unmarshal(b, &customer); err == nil {
		} else {
			fmt.Printf("customer unmarshal failed: %v\n", err)
		}

		topic := "customer"

		deliveryChan := make(chan kafka.Event, 1)

		for i, element := range customer {
			if i%100000 == 0 {
				p.Flush(100)
			}
			b, err := json.Marshal(element)
			if err != nil {
				fmt.Println(err)
				return
			}
			err = p.Produce(&kafka.Message{
				TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
				Value:          b,
				Key:            []byte(element.Id),
			}, deliveryChan)
			if err != nil {
				log.Printf("Failed to produce: %s\n", err)
				os.Exit(1)
			}
		}

		p.Flush(1000)

		// wait for delivery report
		select {
		case ev := <-deliveryChan:
			msg := ev.(*kafka.Message)
			if msg.TopicPartition.Error != nil {
				log.Printf("Delivery failed: %v\n", msg.TopicPartition.Error)
				os.Exit(1)
			}
			log.Printf("Message delivered to %v (len=%d)\n", msg.TopicPartition, len(msg.Value))
		case <-time.After(10 * time.Second):
			log.Println("Timed out waiting for delivery report")
		}

		close(deliveryChan)
	}()

	for {

	}

	fmt.Println("producer finished")
}
