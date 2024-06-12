package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
)

func (c *agnostDNSProviderSolver) makeAgnostRequest(method, baseURL string, body []byte) ([]byte, error) {
	// Parse the base URL
	u, err := url.Parse(baseURL)
	if err != nil {
		log.Printf("Error parsing base URL: %v", err)
		return nil, err
	}

	req, err := http.NewRequest(method, u.String(), bytes.NewReader(body))
	if err != nil {
		log.Printf("Error creating HTTP request: %v", err)
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending HTTP request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		return nil, err
	}

	if resp.StatusCode >= 400 {
		log.Printf("Error from Agnost API: %s", respBody)
		return nil, fmt.Errorf("error from Agnost API: %s", respBody)
	}

	return respBody, nil
}


