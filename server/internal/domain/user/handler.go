package user

import (
	"net/http"
	"strconv"

	"go-crud/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	srv Service
}

func NewHandler(srv Service) *Handler {
	return &Handler{srv: srv}
}

func (h *Handler) RegisterRoutes(c *gin.RouterGroup) {
	users := c.Group("/users")
	users.GET("", h.GetAll)
	users.GET("/:id", h.GetByID)
	users.POST("", h.Create)
	users.PUT("/:id", h.Update)
	users.DELETE("/:id", h.Delete)
}

func (h *Handler) GetAll(c *gin.Context) {
	users, err := h.srv.GetAll(c.Request.Context())

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, users)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	u, err := h.srv.GetByID(c.Request.Context(), id)

	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, http.StatusOK, u)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	u, err := h.srv.Create(c.Request.Context(), req)

	if err != nil {
		response.Error(c, http.StatusConflict, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, u)
}

func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req UpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	u, err := h.srv.Update(c.Request.Context(), id, req)

	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, http.StatusOK, u)
}

func (h *Handler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if err := h.srv.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"message": "user deleted"})
}
