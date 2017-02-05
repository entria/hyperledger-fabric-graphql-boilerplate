package main

import (
	"fmt"
	"testing"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"encoding/json"
	"chaincode/data"
)

func checkInit(t *testing.T, stub *shim.MockStub, args []string) {
	_, err := stub.MockInit("1", "init", args)
	if err != nil {
		fmt.Println("Init failed", err)
		t.FailNow()
	}
}

func checkState(t *testing.T, stub *shim.MockStub, name string, value string) {
	bytes := stub.State[name]
	if bytes == nil {
		fmt.Println("State", name, "failed to get value")
		t.FailNow()
	}
	if string(bytes) != value {
		fmt.Println("State value", name, "was not", value, "as expected")
		t.FailNow()
	}
}

func checkQuery(t *testing.T, stub *shim.MockStub, name string, value string) {
	bytes, err := stub.MockQuery("query", []string{name})
	if err != nil {
		fmt.Println("Query", name, "failed", err)
		t.FailNow()
	}
	if bytes == nil {
		fmt.Println("Query", name, "failed to get value")
		t.FailNow()
	}
	if string(bytes) != value {
		fmt.Println("Query value", name, "was not", value, "as expected")
		t.FailNow()
	}
}

func checkInvoke(t *testing.T, stub *shim.MockStub, function string, args []string) {
	_, err := stub.MockInvoke("1", function, args)
	if err != nil {
		fmt.Println("Invoke", args, "failed", err)
		t.FailNow()
	}
}

/**
Check if indexes were created
 */
func TestTicket_Init(t *testing.T) {
	scc := new(SimpleChaincode)
	stub := shim.NewMockStub("ticket", scc)

	// Init A=123 B=234
	checkInit(t, stub, []string{"A", "123", "B", "234"})

	for k, v := range stub.State {
		fmt.Printf("key[%s] value[%s]\n", k, v)
	}

	emptyIndex := make(map[string]bool)

	emptyString, err := json.Marshal(emptyIndex)

	if err != nil {
		t.FailNow()
	}

	checkState(t, stub, "_users", string(emptyString))
	checkState(t, stub, "_airlines", string(emptyString))
	checkState(t, stub, "_seats", string(emptyString))
}

func TestTicket_AddUser(t *testing.T) {
	scc := new(SimpleChaincode)
	stub := shim.NewMockStub("ticket", scc)

	// Init A=123 B=234
	checkInit(t, stub, []string{"A", "123", "B", "234"})

	for k, v := range stub.State {
		fmt.Printf("key[%s] value[%s]\n", k, v)
	}

	var user = data.User{Id: "0", FirstName: "Sibelius", LastName: "Seraphini"}
	userBytes, err := json.Marshal(&user)

	if err != nil {
		t.FailNow()
	}

	checkInvoke(t, stub, "add_user", []string{"0", string(userBytes)})

	fmt.Println("After add_user")

	for k, v := range stub.State {
		fmt.Printf("key[%s] value[%s]\n", k, v)
	}
}

//func TestExample02_Init(t *testing.T) {
//	scc := new(SimpleChaincode)
//	stub := shim.NewMockStub("ex02", scc)
//
//	// Init A=123 B=234
//	checkInit(t, stub, []string{"A", "123", "B", "234"})
//
//	checkState(t, stub, "A", "123")
//	checkState(t, stub, "B", "234")
//}
//
//func TestExample02_Query(t *testing.T) {
//	scc := new(SimpleChaincode)
//	stub := shim.NewMockStub("ex02", scc)
//
//	// Init A=345 B=456
//	checkInit(t, stub, []string{"A", "345", "B", "456"})
//
//	// Query A
//	checkQuery(t, stub, "A", "345")
//
//	// Query B
//	checkQuery(t, stub, "B", "456")
//}
//
//func TestExample02_Invoke(t *testing.T) {
//	scc := new(SimpleChaincode)
//	stub := shim.NewMockStub("ex02", scc)
//
//	// Init A=567 B=678
//	checkInit(t, stub, []string{"A", "567", "B", "678"})
//
//	// Invoke A->B for 123
//	checkInvoke(t, stub, []string{"A", "B", "123"})
//	checkQuery(t, stub, "A", "444")
//	checkQuery(t, stub, "B", "801")
//
//	// Invoke B->A for 234
//	checkInvoke(t, stub, []string{"B", "A", "234"})
//	checkQuery(t, stub, "A", "678")
//	checkQuery(t, stub, "B", "567")
//	checkState(t, stub, "A", "678")
//	checkState(t, stub, "B", "567")
//}
