package main

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync"
)

type Body struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	r := gin.Default()

	//1 задача
	type ginContext struct {
		//writermem    responseWriter
		Request *http.Request
		//Writer       ResponseWriter
		//Params       Params
		//handlers     HandlersChain
		index    int8
		fullPath string
		//engine       *Engine
		//params       *Params
		//skippedNodes *[]skippedNode
		mu   sync.RWMutex
		Keys map[string]any
		//Errors       errorMsgs
		Accepted   []string
		queryCache url.Values
		formCache  url.Values
		sameSite   http.SameSite
	}
	//11 задача
	config := cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if origin == "http://127.0.0.1:5502" {
				return false
			}
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}
	r.Use(cors.New(config))
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"{}": "Начальная страница"})
	})
	//2 задача
	r.GET("/sportsmens/*path", func(c *gin.Context) {
		pathParams := c.Param("path")
		c.JSON(http.StatusOK, gin.H{"path": pathParams})
	})
	//3 задача
	r.GET("/search", func(c *gin.Context) {
		queryParams := c.Request.URL.Query()
		c.JSON(http.StatusOK, gin.H{"query": queryParams})
	})
	//4 задача
	r.POST("/sport/cookie", func(c *gin.Context) {
		c.SetCookie("s", "someSecure", 900, "/", "localhost", false, true)
		c.JSON(200, gin.H{"cookie": "someCookie is set"})
	})
	//5 задача
	r.GET("/sport/cookie/get", func(c *gin.Context) {
		cookieValue, _ := c.Cookie("secure")
		c.JSON(200, gin.H{"cookieValue:": cookieValue})
	})
	//6 задача
	authMiddleware := func(c *gin.Context) {
		cookie, err := c.Cookie("s")
		if err != nil || cookie != "someSecure" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
	r.GET("/protected", authMiddleware, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Welcome to the protected route!"})
	})
	//7 задача
	r.Use(static.ServeRoot("/static", "./tmp"))
	r.POST("/upload", func(c *gin.Context) {
		if err := os.MkdirAll("./tmp", os.ModePerm); err != nil {
			log.Println("Ошибка при создании директории:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать директорию"})
			return
		}
		form, err := c.MultipartForm()
		if err != nil {
			log.Println("Ошибка при получении multipart формы:", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось получить данные формы"})
			return
		}
		files, ok := form.File["file"]
		if !ok || len(files) == 0 {
			log.Println("Файлы не найдены в форме")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Файлы не найдены"})
			return
		}
		for _, file := range files {
			fullPath := filepath.Join("./tmp", file.Filename)
			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				log.Println("Ошибка при сохранении файла:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить файл"})
				return
			}
			log.Println("Файл успешно загружен:", fullPath)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Файлы успешно загружены"})
	})
	//8задача
	r.Use(static.Serve("/static", static.LocalFile("./tmp", true)))
	r.GET("/static/download/*filepath", func(c *gin.Context) {
		filePath := c.Param("filepath")
		fullPath := filepath.Join("./tmp", filePath)
		c.Header("Content-Disposition", "attachment; filename="+filepath.Base(fullPath))
		c.File(fullPath)
	})
	//9 задача
	r.POST("/headers", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Application", "someValue")
		c.JSON(http.StatusOK, gin.H{"message": "Headers set successfully"})
	})
	//10 задача
	r.GET("/headers", func(c *gin.Context) {
		headers := c.Request.Header
		c.JSON(http.StatusOK, gin.H{"headers": headers})

	})
	//12 задача
	r.POST("/body", func(c *gin.Context) {
		var body Body
		err := c.BindJSON(&body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		fmt.Printf("bodyAge: %d, bodyName: %v...", body.Age, body.Name)
	})
	r.Run(":8080")
}
