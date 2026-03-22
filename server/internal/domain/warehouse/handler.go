package warehouse

import (
	"fmt"
	"net/http"
	"strconv"

	"go-crud/internal/middleware"
	"go-crud/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	wh := rg.Group("/warehouse")
	wh.Use(middleware.Auth())
	wh.GET("/transactions", h.GetPaged)
	wh.GET("/transactions/:id", h.GetByID)
	wh.POST("/transactions", h.Create)
	wh.GET("/transactions/:id/invoice", h.GetInvoice)
}

func (h *Handler) GetPaged(c *gin.Context) {
	var q TxPageQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	result, err := h.svc.GetPaged(c.Request.Context(), q)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusOK, result)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	tx, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}
	response.Success(c, http.StatusOK, tx)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	tx, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusCreated, tx)
}

func (h *Handler) GetInvoice(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	tx, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}
	if tx.Type != TxExport {
		response.Error(c, http.StatusBadRequest, "invoice only available for EXPORT transactions")
		return
	}
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="invoice_%d.xlsx"`, id))
	if err := WriteInvoiceExcel(tx, c.Writer); err != nil {
		return
	}
}
