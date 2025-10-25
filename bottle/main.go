package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
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
}

func main() {
	dataPath := "/Users/jamo/code/fapi-arch-hackathon/apps/data/output/APPA/booking.json"

	b, err := os.ReadFile(dataPath)
	if err != nil {
		fmt.Printf("read file: %v\n", err)
		return
	}

	// Option B: decode into a generic map (use when shape is unknown)
	var bookings []Booking
	if err := json.Unmarshal(b, &bookings); err == nil {
		pretty, _ := json.MarshalIndent(bookings, "", "  ")
		fmt.Printf("Decoded bookings JSON:\n%s\n", string(pretty))
	} else {
		fmt.Printf("bookings unmarshal failed: %v\n", err)
	}

	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	// Durable topic exchange
	exchangeName := "events"
	err = ch.ExchangeDeclare(
		exchangeName,
		"topic", // allows routing by pattern
		true,    // durable
		false,   // auto-delete
		false,   // internal
		false,   // no-wait
		nil,
	)
	failOnError(err, "Failed to declare exchange")

	// Quorum queue for persistence and HA
	queueName := "order_events_group_a"
	args := amqp.Table{
		"x-queue-type": "quorum",
	}

	q, err := ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		args,
	)
	failOnError(err, "Failed to declare queue")

	// Bind with routing key
	routingKey := "orders.created"
	err = ch.QueueBind(
		q.Name,
		routingKey,
		exchangeName,
		false,
		nil,
	)
	failOnError(err, "Failed to bind queue")

	// Publish persistent event
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for _, element := range bookings {

		b, err := json.Marshal(element)
		if err != nil {
			fmt.Println(err)
			return
		}

		err = ch.PublishWithContext(ctx,
			exchangeName, // exchange
			routingKey,   // routing key
			false,        // mandatory
			false,        // immediate
			amqp.Publishing{
				ContentType:  "application/json",
				DeliveryMode: amqp.Persistent, // VERY important!
				Body:         b,
				Timestamp:    time.Now(),
			})
		failOnError(err, "Failed to publish message")

		log.Printf("Published event: %s", string(b))

	}
}
