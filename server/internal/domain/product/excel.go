package product

import (
	"io"

	"github.com/xuri/excelize/v2"
)

// WriteProductsExcel streams an xlsx file into w using excelize StreamWriter.
// The caller must set Content-Type / Content-Disposition headers before calling.
func WriteProductsExcel(products []Product, w io.Writer) error {
	f := excelize.NewFile()
	defer f.Close()

	// Bold style for header row
	boldStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
	})
	if err != nil {
		return err
	}

	sw, err := f.NewStreamWriter("Sheet1")
	if err != nil {
		return err
	}

	// Column widths: col index (1-based), width
	colWidths := [][2]int{{1, 6}, {2, 28}, {3, 40}, {4, 12}, {5, 8}, {6, 22}, {7, 22}}
	for _, cw := range colWidths {
		if err := sw.SetColWidth(cw[0], cw[0], float64(cw[1])); err != nil {
			return err
		}
	}

	// Header row
	headers := []any{
		excelize.Cell{StyleID: boldStyle, Value: "ID"},
		excelize.Cell{StyleID: boldStyle, Value: "Name"},
		excelize.Cell{StyleID: boldStyle, Value: "Description"},
		excelize.Cell{StyleID: boldStyle, Value: "Price ($)"},
		excelize.Cell{StyleID: boldStyle, Value: "Stock"},
		excelize.Cell{StyleID: boldStyle, Value: "Created At"},
		excelize.Cell{StyleID: boldStyle, Value: "Updated At"},
	}
	if err := sw.SetRow("A1", headers, excelize.RowOpts{Height: 20}); err != nil {
		return err
	}

	// Data rows
	for i, p := range products {
		cell, err := excelize.CoordinatesToCellName(1, i+2)
		if err != nil {
			return err
		}
		row := []any{
			p.ID,
			p.Name,
			p.Description,
			p.Price,
			p.Stock,
			p.CreatedAt.Format("2006-01-02 15:04:05"),
			p.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := sw.SetRow(cell, row); err != nil {
			return err
		}
	}

	if err := sw.Flush(); err != nil {
		return err
	}

	// WriteTo implements io.WriterTo ? streams the xlsx directly into w
	_, err = f.WriteTo(w)
	return err
}
