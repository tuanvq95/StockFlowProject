package order

import (
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
	g := rg.Group("/orders")
	g.Use(middleware.Auth())
	g.GET("", h.GetPaged)
	g.POST("", h.Create)
	g.GET("/:id", h.GetByID)
	g.PATCH("/:id/status", h.UpdateStatus)

	// Separate group to avoid conflict with /:id param
	byCode := rg.Group("/orders-by-code")
	byCode.Use(middleware.Auth())
	byCode.GET("/:code", h.GetByCode)
}

func (h *Handler) GetPaged(c *gin.Context) {
	var q PageQuery
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
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid id")
		return
	}
	o, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}
	response.Success(c, http.StatusOK, o)
}

func (h *Handler) GetByCode(c *gin.Context) {
	code := c.Param("code")
	o, err := h.svc.GetByCode(c.Request.Context(), code)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}
	response.Success(c, http.StatusOK, o)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	o, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(c, http.StatusCreated, o)
}

func (h *Handler) UpdateStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid id")
		return
	}
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	o, err := h.svc.UpdateStatus(c.Request.Context(), id, req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(c, http.StatusOK, o)
}
