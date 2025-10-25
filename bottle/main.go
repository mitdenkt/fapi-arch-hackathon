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

	// configure logger
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	// build config map, enable broker debug when verbose
	config := kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092,localhost:9093,localhost:9094",
		"client.id":         "myProducer",
		"acks":              "all",
	}

	p, err := kafka.NewProducer(&config)
	if err != nil {
		log.Printf("Failed to create producer: %s\n", err)
		os.Exit(1)
	}
	defer p.Close()

	topic := "events"

	deliveryChan := make(chan kafka.Event, 1)

	for _, element := range bookings {
		b, err := json.Marshal(element)
		if err != nil {
			fmt.Println(err)
			return
		}
		err = p.Produce(&kafka.Message{
			TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
			Value:          b,
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

	// flush outstanding messages before exiting
	remaining := p.Flush(15 * 1000)
	if remaining > 0 {
		log.Printf("Flush timeout, %d message(s) still in queue\n", remaining)
	} else {
	}

	fmt.Println("producer finished")
}
