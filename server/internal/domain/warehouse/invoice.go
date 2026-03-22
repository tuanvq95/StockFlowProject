package warehouse

import (
	"fmt"
	"io"

	"github.com/xuri/excelize/v2"
)

func WriteInvoiceExcel(tx *Transaction, w io.Writer) error {
	f := excelize.NewFile()
	defer f.Close()

	boldStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
	})
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14},
	})
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"4F46E5"}},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	rightBoldStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "right"},
	})
	moneyStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 4})

	sheet := "Sheet1"
	f.SetColWidth(sheet, "A", "A", 6)
	f.SetColWidth(sheet, "B", "B", 32)
	f.SetColWidth(sheet, "C", "C", 10)
	f.SetColWidth(sheet, "D", "D", 16)
	f.SetColWidth(sheet, "E", "E", 16)

	// Title
	f.MergeCell(sheet, "A1", "E1")
	f.SetCellValue(sheet, "A1", "EXPORT INVOICE")
	f.SetCellStyle(sheet, "A1", "A1", titleStyle)

	// Meta
	f.SetCellValue(sheet, "A3", "Invoice #")
	f.SetCellStyle(sheet, "A3", "A3", boldStyle)
	f.SetCellValue(sheet, "B3", fmt.Sprintf("INV-%05d", tx.ID))

	f.SetCellValue(sheet, "A4", "Date")
	f.SetCellStyle(sheet, "A4", "A4", boldStyle)
	f.SetCellValue(sheet, "B4", tx.CreatedAt.Format("02/01/2006 15:04:05"))

	if tx.Note != "" {
		f.SetCellValue(sheet, "A5", "Note")
		f.SetCellStyle(sheet, "A5", "A5", boldStyle)
		f.SetCellValue(sheet, "B5", tx.Note)
	}

	// Table header
	row := 7
	cols := []string{"A", "B", "C", "D", "E"}
	headers := []any{"#", "Product", "Qty", "Unit Price ($)", "Subtotal ($)"}
	for i, col := range cols {
		cell := fmt.Sprintf("%s%d", col, row)
		f.SetCellValue(sheet, cell, headers[i])
		f.SetCellStyle(sheet, cell, cell, headerStyle)
	}
	row++

	for i, item := range tx.Items {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), item.ProductName)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), item.Quantity)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), item.UnitPrice)
		f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), moneyStyle)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), float64(item.Quantity)*item.UnitPrice)
		f.SetCellStyle(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), moneyStyle)
		row++
	}

	// Total row
	totalRow := row + 1
	f.MergeCell(sheet, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("D%d", totalRow))
	f.SetCellValue(sheet, fmt.Sprintf("A%d", totalRow), "TOTAL")
	f.SetCellStyle(sheet, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("A%d", totalRow), rightBoldStyle)
	f.SetCellValue(sheet, fmt.Sprintf("E%d", totalRow), tx.TotalAmount)
	f.SetCellStyle(sheet, fmt.Sprintf("E%d", totalRow), fmt.Sprintf("E%d", totalRow), moneyStyle)

	_, err := f.WriteTo(w)
	return err
}
