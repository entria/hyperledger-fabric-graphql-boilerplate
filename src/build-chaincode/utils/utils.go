// General utilities for chaincode
package utils

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/pkg/errors"
	"strconv"
	"fmt"
	"build-chaincode/data"
)

var logger = shim.NewLogger("utils")

func main() {
	logger.SetLevel(shim.LogInfo)
}

// Open a Ledgers if one does not exist
func InitLedger(stub shim.ChaincodeStubInterface, tableName string) error {

	// Generic Table Creation Function - requires Table Name and Table Key Entry
	// Create Table - Get number of Keys the tables supports
	// This version assumes all Keys are String and the Data is Bytes
	// This Function can replace all other InitLedger function in this app such as InitItemLedger()

	nKeys := data.GetNumberOfKeys(tableName)
	if nKeys < 1 {
		fmt.Println("Atleast 1 Key must be provided \n")
		fmt.Println("Auction_Application: Failed creating Table ", tableName)
		return errors.New("Auction_Application: Failed creating Table " + tableName)
	}

	var columnDefsForTbl []*shim.ColumnDefinition

	for i := 0; i < nKeys; i++ {
		columnDef := shim.ColumnDefinition{Name: "keyName" + strconv.Itoa(i), Type: shim.ColumnDefinition_STRING, Key: true}
		columnDefsForTbl = append(columnDefsForTbl, &columnDef)
	}

	columnLastTblDef := shim.ColumnDefinition{Name: "Details", Type: shim.ColumnDefinition_BYTES, Key: false}
	columnDefsForTbl = append(columnDefsForTbl, &columnLastTblDef)

	// Create the Table (Nil is returned if the Table exists or if the table is created successfully
	err := stub.CreateTable(tableName, columnDefsForTbl)

	if err != nil {
		fmt.Println("Auction_Application: Failed creating Table ", tableName)
		return errors.New("Auction_Application: Failed creating Table " + tableName)
	}

	return err
}

////////////////////////////////////////////////////////////////////////////
// Open a User Registration Table if one does not exist
// Register users into this table
////////////////////////////////////////////////////////////////////////////
func UpdateLedger(stub shim.ChaincodeStubInterface, tableName string, keys []string, args []byte) error {
	nKeys := data.GetNumberOfKeys(tableName)
	if nKeys < 1 {
		fmt.Println("Atleast 1 Key must be provided \n")
	}

	var columns []*shim.Column

	for i := 0; i < nKeys; i++ {
		col := shim.Column{Value: &shim.Column_String_{String_: keys[i]}}
		columns = append(columns, &col)
	}

	lastCol := shim.Column{Value: &shim.Column_Bytes{Bytes: []byte(args)}}
	columns = append(columns, &lastCol)

	row := shim.Row{columns}
	ok, err := stub.InsertRow(tableName, row)
	if err != nil {
		return fmt.Errorf("UpdateLedger: InsertRow into "+tableName+" Table operation failed. %s", err)
	}
	if !ok {
		return errors.New("UpdateLedger: InsertRow into " + tableName + " Table failed. Row with given key " + keys[0] + " already exists")
	}

	fmt.Println("UpdateLedger: InsertRow into ", tableName, " Table operation Successful. ")
	return nil
}

////////////////////////////////////////////////////////////////////////////
// Query a User Object by Table Name and Key
////////////////////////////////////////////////////////////////////////////
func QueryLedger(stub shim.ChaincodeStubInterface, tableName string, args []string) ([]byte, error) {

	var columns []shim.Column
	nCol := data.GetNumberOfKeys(tableName)

	logger.Infof("queryLedger: ", nCol)

	for i := 0; i < nCol; i++ {
		colNext := shim.Column{Value: &shim.Column_String_{String_: args[i]}}
		columns = append(columns, colNext)
	}

	logger.Infof("columns: ", columns);

	row, err := stub.GetRow(tableName, columns)
	fmt.Println("Length or number of rows retrieved ", len(row.Columns))

	if len(row.Columns) == 0 {
		jsonResp := "{\"Error\":\"Failed retrieving data " + args[0] + ". \"}"
		fmt.Println("Error retrieving data record for Key = ", args[0], "Error : ", jsonResp)
		return nil, errors.New(jsonResp)
	}

	//fmt.Println("User Query Response:", row)
	//jsonResp := "{\"Owner\":\"" + string(row.Columns[nCol].GetBytes()) + "\"}"
	//fmt.Println("User Query Response:%s\n", jsonResp)
	Avalbytes := row.Columns[nCol].GetBytes()

	// Perform Any additional processing of data
	fmt.Println("QueryLedger() : Successful - Proceeding to ProcessRequestType ")
	//err = ProcessQueryResult(stub, Avalbytes, args)
	if err != nil {
		fmt.Println("QueryLedger() : Cannot create object  : ", args[1])
		jsonResp := "{\"QueryLedger() Error\":\" Cannot create Object for key " + args[0] + "\"}"
		return nil, errors.New(jsonResp)
	}
	return Avalbytes, nil
}

////////////////////////////////////////////////////////////////////////////
// Get a List of Rows based on query criteria from the OBC
////////////////////////////////////////////////////////////////////////////
func GetList(stub shim.ChaincodeStubInterface, tableName string, args []string) ([]shim.Row, error) {
	var columns []shim.Column

	nKeys := data.GetNumberOfKeys(tableName)
	nCol := len(args)
	if nCol < 1 {
		fmt.Println("Atleast 1 Key must be provided \n")
		return nil, errors.New("GetList failed. Must include at least key values")
	}

	for i := 0; i < nCol; i++ {
		colNext := shim.Column{Value: &shim.Column_String_{String_: args[i]}}
		columns = append(columns, colNext)
	}

	rowChannel, err := stub.GetRows(tableName, columns)
	if err != nil {
		return nil, fmt.Errorf("GetList operation failed. %s", err)
	}
	var rows []shim.Row
	for {
		select {
		case row, ok := <-rowChannel:
			if !ok {
				rowChannel = nil
			} else {
				rows = append(rows, row)
				//If required enable for debugging
				//fmt.Println(row)
			}
		}
		if rowChannel == nil {
			break
		}
	}

	fmt.Println("Number of Keys retrieved : ", nKeys)
	fmt.Println("Number of rows retrieved : ", len(rows))
	return rows, nil
}

//func TableOperations (stub shim.ChaincodeStubInterface) {
//
//	err := stub.CreateTable(“TableName”, []*shim.ColumnDefinition{
//		&shim.ColumnDefinition{Name: “KeyColumnName”, Type: shim.ColumnDefinition_STRING, Key: true},
//		&shim.ColumnDefinition{Name: "ColumnName2", Type: shim.ColumnDefinition_STRING, Key: false},
//		&shim.ColumnDefinition{Name: "ColumnName3", Type: shim.ColumnDefinition_STRING, Key: false},
//	})
//
//
//	success, err := stub.InsertRow("TableName", shim.Row{
//		Columns: []*shim.Column{
//			&shim.Column{Value: &shim.Column_String_{String_: Val1}},
//			&shim.Column{Value: &shim.Column_String_{String_: Val2}},
//			&shim.Column{Value: &shim.Column_String_{String_: Val3}},
//		},
//	})
//
//
//	success, err := stub.ReplaceRow("TableName", shim.Row{
//		Columns: []*shim.Column{
//			&shim.Column{Value: &shim.Column_String_{String_: Val1}},
//			&shim.Column{Value: &shim.Column_String_{String_: Val2}},
//			&shim.Column{Value: &shim.Column_String_{String_: Val3}},
//		},
//	})
//
//
//	var columns []shim.Column
//	keyColumn := shim.Column{Value: &shim.Column_String_{String_: KeyColumnName}}
//	columns = append(columns, keyColumn)
//	row, err := stub.GetRow("TableName", columns)
//
//}
