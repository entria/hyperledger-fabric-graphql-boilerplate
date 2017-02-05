package query

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/pkg/errors"
	//"strconv"
	"build-chaincode/data"
	"build-chaincode/utils"
	"encoding/json"
	"fmt"
)

var logger = shim.NewLogger("query")

func main() {
	logger.SetLevel(shim.LogInfo)
}

var Functions = map[string]func(shim.ChaincodeStubInterface,[]string)([]byte, error) {
	"query": getState,
	"UserGetAll": userGetAll,
	"UserGet": userGet,
	"AirlineGetAll": airlineGetAll,
	"AirlineGet": airlineGet,
}

//=================================================================================================================================
//	Query - Called on chaincode query. Takes a function name passed and calls that function. Passes the
//  		initial arguments passed are passed on to the called function.
//
//=================================================================================================================================
func Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	logger.Infof("-- Querying function %v with args %v", function, args)

	if QueryRequest, ok := Functions[function]; ok {
		return  QueryRequest(stub, args)
	}

	return nil, errors.New("Received unknown query function name: " +  function)
}

//==============================================================================================================================
//		Query Functions
//==============================================================================================================================
func getState(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var A string // Entities
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the person to query")
	}

	A = args[0]

	// Get the state from the ledger
	Avalbytes, err := stub.GetState(A)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return nil, errors.New(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
		return nil, errors.New(jsonResp)
	}

	jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return Avalbytes, nil
}

func userGetAll(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	rows, err := utils.GetList(stub, "User", []string{"ALL"})
	if err != nil {
		return nil, fmt.Errorf("GetListOfInitAucs operation failed. Error marshaling JSON: %s", err)
	}

	nCol := data.GetNumberOfKeys("User")

	tlist := make([]data.User, len(rows))
	for i := 0; i < len(rows); i++ {
		ts := rows[i].Columns[nCol].GetBytes()
		ar, err := data.JSONtoUser(ts)
		if err != nil {
			fmt.Println("GetListOfInitAucs() Failed : Ummarshall error")
			return nil, fmt.Errorf("getBillForMonth() operation failed. %s", err)
		}
		tlist[i] = ar
	}

	jsonRows, _ := json.Marshal(tlist)

	fmt.Println("List of Users Requested : ", string(jsonRows))
	return jsonRows, nil
}

func userGet(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return  nil, errors.New("Incorrect number of arguments. Expecting id of user")
	}

	var Id = args[0]

	var err error

	var keys = []string{"ALL", string(Id)}

	logger.Infof("userGet: ", Id, keys)

	// Get the Object and Display it
	Avalbytes, err := utils.QueryLedger(stub, "User", keys)
	if err != nil {
		fmt.Println("UserGet() : Failed to Query Object ")
		jsonResp := "{\"Error\":\"Failed to get  Object Data for " + args[0] + "\"}"
		return nil, errors.New(jsonResp)
	}

	if Avalbytes == nil {
		fmt.Println("UserGet() : Incomplete Query Object ")
		jsonResp := "{\"Error\":\"Incomplete information about the key for " + args[0] + "\"}"
		return nil, errors.New(jsonResp)
	}

	fmt.Println("UserGet() : Response : Successfull -", string(Avalbytes))
	return Avalbytes, nil
}

func airlineGetAll(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	rows, err := utils.GetList(stub, "Airline", []string{"ALL"})
	if err != nil {
		return nil, fmt.Errorf("GetListOfInitAucs operation failed. Error marshaling JSON: %s", err)
	}

	nCol := data.GetNumberOfKeys("Airline")

	tlist := make([]data.Airline, len(rows))
	for i := 0; i < len(rows); i++ {
		ts := rows[i].Columns[nCol].GetBytes()
		ar, err := data.JSONtoAirline(ts)
		if err != nil {
			fmt.Println("GetListOfInitAucs() Failed : Ummarshall error")
			return nil, fmt.Errorf("getBillForMonth() operation failed. %s", err)
		}
		tlist[i] = ar
	}

	jsonRows, _ := json.Marshal(tlist)

	fmt.Println("List of Airlines Requested : ", string(jsonRows))
	return jsonRows, nil
}

func airlineGet(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return  nil, errors.New("Incorrect number of arguments. Expecting id of airline")
	}

	var Id = args[0]

	var err error

	var keys = []string{"ALL", string(Id)}

	logger.Infof("airlineGet: ", Id, keys)

	// Get the Object and Display it
	Avalbytes, err := utils.QueryLedger(stub, "Airline", keys)
	if err != nil {
		fmt.Println("AirlineGet() : Failed to Query Object ")
		jsonResp := "{\"Error\":\"Failed to get  Object Data for " + args[0] + "\"}"
		return nil, errors.New(jsonResp)
	}

	if Avalbytes == nil {
		fmt.Println("AirlineGet() : Incomplete Query Object ")
		jsonResp := "{\"Error\":\"Incomplete information about the key for " + args[0] + "\"}"
		return nil, errors.New(jsonResp)
	}

	fmt.Println("AirlineGet() : Response : Successfull -", string(Avalbytes))
	return Avalbytes, nil
}
