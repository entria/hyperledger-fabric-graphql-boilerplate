package invoke

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"build-chaincode/utils"
	"build-chaincode/data"
	"errors"
	"fmt"
	"strconv"
)

var logger = shim.NewLogger("invoke")

func main() {
	logger.SetLevel(shim.LogInfo)
}

var Functions = map[string]func(shim.ChaincodeStubInterface,[]string)([]byte, error) {
	"UserCreate": userCreate,
	"AirlineCreate": airlineCreate,
}

//==============================================================================================================================
//	Init Function - Called when the user deploys the chaincode
//==============================================================================================================================
func Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	logger.Infof("Deployed chaincode")

	var err error

	// Create tables
	for _, table := range data.TicketTables {
		err = stub.DeleteTable(table)
		if err != nil {
			return nil, fmt.Errorf("Init(): DeleteTable of %s  Failed ", table)
		}
		err = utils.InitLedger(stub, table)
		if err != nil {
			return nil, fmt.Errorf("Init(): InitLedger of %s  Failed ", table)
		}

		logger.Infof("Creating Table %s", table)
	}

	// Update the ledger with the Application version
	err = stub.PutState("version", []byte(strconv.Itoa(23)))
	if err != nil {
		return nil, err
	}

	return nil, nil
}

// Invoke function.
func Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	logger.Infof("-- Invoking function %v with args %v", function, args)

	if function == "init" {
		return  Init(stub, "init", args)
	} else {
		if InvokeRequest, ok := Functions[function]; ok {
			return  InvokeRequest(stub, args)
		}

		return nil, errors.New("Invoke() : Invalid function : " + function)
	}

	return nil, errors.New("Received unknown invoke function name")
}

//==============================================================================================================================
//		Invoke Functions
//==============================================================================================================================
// Create an new User
func userCreate(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println(args)

	if len(args) != 3 {
		return  nil, errors.New("Incorrect number of arguments. Expecting id, name and passport of user")
	}

	var Id = args[0]
	var Name = args[1]
	var Passport = args[2]

	var user = data.User{Id, Name, Passport}

	fmt.Println(args)

	buff, err := user.ToJson()

	fmt.Println(string(buff))

	if err != nil {
		fmt.Println("userCreate() : Failed Cannot create object buffer for write : ", args[1])
		return nil, errors.New("userCreate(): Failed Cannot create object buffer for write : " + args[1])
	} else {
		// Update the ledger with the Buffer Data
		// err = stub.PutState(args[0], buff)
		keys := []string{"ALL", args[0]}
		fmt.Println("keys", keys)
		err = utils.UpdateLedger(stub, "User", keys, buff)
		if err != nil {
			fmt.Println("userCreate() : write error while inserting record")
			return nil, err
		}
	}

	return  nil, nil
}

// Create an new Airline
func airlineCreate(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println(args)

	if len(args) != 3 {
		return  nil, errors.New("Incorrect number of arguments. Expecting id, name and ICAO of airline")
	}

	var Id = args[0]
	var Name = args[1]
	var Icao = args[2]

	var airline = data.Airline{Id, Name, Icao}

	fmt.Println(args)

	buff, err := airline.ToJson()

	fmt.Println(string(buff))

	if err != nil {
		fmt.Println("airlineCreate() : Failed Cannot create object buffer for write : ", args[1])
		return nil, errors.New("airlineCreate(): Failed Cannot create object buffer for write : " + args[1])
	} else {
		// Update the ledger with the Buffer Data
		// err = stub.PutState(args[0], buff)
		keys := []string{"ALL", args[0]}
		fmt.Println("keys", keys)
		err = utils.UpdateLedger(stub, "Airline", keys, buff)
		if err != nil {
			fmt.Println("airlineCreate() : write error while inserting record")
			return nil, err
		}
	}

	return  nil, nil
}
