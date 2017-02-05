package main

import (
	"build-chaincode/invoke"
	"build-chaincode/query"

	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

var logger = shim.NewLogger("block-ticket")

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	bytes, err := invoke.Init(stub, function, args)
	if err != nil { logger.Errorf("Error invoking Init: %v \n %v", function, err) }
	return bytes, err
}

// Transaction makes payment of X units from A to B
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	bytes, err := invoke.Invoke(stub, function, args)
	if err != nil { logger.Errorf("Error invoking %v: %v", function, err) }
	return bytes, err
}

// Query callback representing the query of a chaincode
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	bytes, err := query.Query(stub, function, args)
	if err != nil { logger.Errorf("Error querying %v: %v", function, err) }
	return bytes, err
}

func main() {
	logger.SetLevel(shim.LogInfo)

	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}


