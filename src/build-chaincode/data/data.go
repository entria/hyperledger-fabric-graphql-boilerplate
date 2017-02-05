package data

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"fmt"
)

var logger = shim.NewLogger("data")

func main() {
	logger.SetLevel(shim.LogInfo)
}

var TicketTables = []string{"User", "Airline"}

// A saveable model to a Table in blockchain
type Model interface {
	GetTableName() string // Every model has a Table Name
	FromJson(string) (User, error)
	ToJson() ([]byte, error)
	NumberOfKeys()
}

/**
An user that can buy a seat in a flight
 */
type User struct {
	Id string // Primary Key
	Name string // User name
	Passport string // User passport
}

/**
An airline that run flights
 */
type Airline struct {
	Id string // Primary Key
	Name string // Airline name
	Icao string // Airline ICAO - for instance, EMT
}

/**
User related data and functions
 */
// Object oriented stuff \o/
func (u User) GetTableName() string {
	return "User"
}

func (u User) FromJson(areq []byte) (User, error) {
	err := json.Unmarshal(areq, &u)
	if err != nil {
		fmt.Println("JSONtoUser error: ", err)
		return u, err
	}
	return u, err
}

func (u User) ToJson() ([]byte, error) {
	ajson, err := json.Marshal(u)
	if err != nil {
		fmt.Println("UsertoJSON error: ", err)
		return nil, err
	}
	fmt.Println("UsertoJSON created: ", ajson)
	return ajson, nil
}

func (u User) NumberOfKeys() int {
	return  2
}

//////////////////////////////////////////////////////////
// Converts JSON String to User Object
//////////////////////////////////////////////////////////
func JSONtoUser(areq []byte) (User, error) {

	user := User{}
	err := json.Unmarshal(areq, &user)
	if err != nil {
		fmt.Println("JSONtoUser error: ", err)
		return user, err
	}
	return user, err
}

func UsertoJSON(user User) ([]byte, error) {

	ajson, err := json.Marshal(user)
	if err != nil {
		fmt.Println("UsertoJSON error: ", err)
		return nil, err
	}
	fmt.Println("UsertoJSON created: ", ajson)
	return ajson, nil
}

/**
Airline related data and functions
 */
// Object oriented stuff \o/
func (u Airline) GetTableName() string {
	return "Airline"
}

func (u Airline) FromJson(areq []byte) (Airline, error) {
	err := json.Unmarshal(areq, &u)
	if err != nil {
		fmt.Println("JSONtoUser error: ", err)
		return u, err
	}
	return u, err
}

func (u Airline) ToJson() ([]byte, error) {
	ajson, err := json.Marshal(u)
	if err != nil {
		fmt.Println("AirlinetoJSON error: ", err)
		return nil, err
	}
	fmt.Println("AirlinetoJSON created: ", ajson)
	return ajson, nil
}

func (u Airline) NumberOfKeys() int {
	return  2
}

//////////////////////////////////////////////////////////
// Converts JSON String to Airline Object
//////////////////////////////////////////////////////////
func JSONtoAirline(areq []byte) (Airline, error) {

	airline := Airline{}
	err := json.Unmarshal(areq, &airline)
	if err != nil {
		fmt.Println("JSONtoUser error: ", err)
		return airline, err
	}
	return airline, err
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// A Map that holds TableNames and the number of Keys
// This information is used to dynamically Create, Update
// Replace , and Query the Ledger
// In this model all attributes in a table are strings
// The chain code does both validation
// A dummy key like ALL in some cases is used for a query to get all rows
//
//              "User":        		1, Key: "ALL", Id
//		"Airline":		2, Key: "ALL", Id
//
/////////////////////////////////////////////////////////////////////////////////////////////////////
func GetNumberOfKeys(tname string) int {
	TableMap := map[string]int{
		"User":        	2,
		"Airline": 	2,
	}
	return TableMap[tname]
}
