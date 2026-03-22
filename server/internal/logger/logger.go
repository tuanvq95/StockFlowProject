package logger

import (
	"log/slog"
	"os"
)

var Log *slog.Logger

func Init() {
	os.MkdirAll("logs", os.ModePerm)

	file, err := os.OpenFile("logs/app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic(err)
	}

	multiWriter := slog.NewJSONHandler(file, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})

	Log = slog.New(multiWriter)
}
