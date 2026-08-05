# 🏛️ Dukcapil KTP Verification Service

Layanan microservice untuk verifikasi data KTP Dukcapil yang digunakan oleh Customer Registration Service.

## 📋 Daftar Isi
- [Overview](#overview)
- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Docker](#docker)
- [Monitoring](#monitoring)

## 🎯 Overview

Dukcapil Service adalah microservice yang mengelola verifikasi data KTP (Kartu Tanda Penduduk) dari database Dukcapil. Service ini menyediakan API untuk:

- ✅ Verifikasi NIK dan nama lengkap
- 🔍 Pengecekan keberadaan NIK
- 📊 Statistik data KTP
- 🔎 Pencarian data berdasarkan nama

## ✨ Fitur

### Core Features
- **NIK Verification**: Verifikasi NIK dengan nama lengkap
- **Case-Insensitive Search**: Pencarian tidak sensitif terhadap huruf besar/kecil
- **Data Validation**: Validasi format NIK 16 digit
- **Performance Optimized**: Database indexing untuk query cepat
- **Error Handling**: Comprehensive error responses

### Security Features
- **CORS Protection**: Configured CORS untuk Customer Service
- **Input Validation**: Strict validation dengan Bean Validation
- **SQL Injection Protection**: Parameterized queries
- **Security Headers**: Security headers pada response

### Monitoring Features
- **Health Check**: Endpoint untuk monitoring
- **Statistics**: Real-time statistics data KTP
- **Performance Metrics**: Response time tracking
- **Audit Logging**: Request/response logging

## 🛠️ Tech Stack

- **Java 21** - Programming language
- **Spring Boot 3.2** - Framework
- **Spring Data JPA** - Data access
- **PostgreSQL 15** - Database
- **Maven** - Build tool
- **Docker** - Containerization

## 🚀 Setup

### Prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL 15+
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd dukcapil-service
```

### 2. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE dukcapil_ktp;"

# Run setup script
psql -U postgres -d dukcapil_ktp -f create_dukcapil_database.sql
```

### 3. Configuration
```bash
# Copy example config
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Edit database configuration
vim src/main/resources/application.properties
```

### 4. Build & Run
```bash
# Build project
mvn clean compile

# Run application
mvn spring-boot:run

# Or run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=development
```

### 5. Verify Installation
```bash
# Health check
curl http://localhost:8081/api/dukcapil/health

# Test verification
curl -X POST http://localhost:8081/api/dukcapil/verify-nik \
  -H "Content-Type: application/json" \
  -d '{"nik": "3175031234567890", "namaLengkap": "John Doe"}'
```

## 📡 API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dukcapil/health` | Service health check |
| GET | `/api/dukcapil/ping` | Simple ping test |
| GET | `/api/dukcapil/docs` | API documentation |
| GET | `/api/dukcapil/stats` | Service statistics |

### Core Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dukcapil/verify-nik` | Verify NIK + name |
| POST | `/api/dukcapil/check-nik` | Check NIK existence |
| GET | `/api/dukcapil/ktp-data/{nik}` | Get KTP data by NIK |

### Search & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dukcapil/search-name?name={name}` | Search by name |
| GET | `/api/dukcapil/stats/comprehensive` | Detailed statistics |

### Request/Response Examples

#### Verify NIK
```bash
# Request
POST /api/dukcapil/verify-nik
{
  "nik": "3175031234567890",
  "namaLengkap": "John Doe"
}

# Response - Success
{
  "valid": true,
  "message": "Data NIK dan nama valid sesuai database Dukcapil",
  "data": {
    "nik": "3175031234567890",
    "namaLengkap": "John Doe",
    "tempatLahir": "Jakarta",
    "tanggalLahir": "1990-05-15",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "alamat": "Jl. Sudirman No. 123, RT 001/RW 002",
    "kecamatan": "Tanah Abang",
    "kelurahan": "Bendungan Hilir"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "Dukcapil Service"
}
```

#### Check NIK
```bash
# Request
POST /api/dukcapil/check-nik
{
  "nik": "3175031234567890"
}

# Response
{
  "exists": true,
  "nik": "3175031234567890",
  "message": "NIK terdaftar di database Dukcapil",
  "service": "Dukcapil Service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Automated Testing
```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run with coverage
mvn clean test jacoco:report
```

### Manual Testing
```bash
# Run comprehensive test script
chmod +x test_dukcapil_service.sh
./test_dukcapil_service.sh

# Test specific endpoint
curl -X POST http://localhost:8081/api/dukcapil/verify-nik \
  -H "Content-Type: application/json" \
  -d '{"nik": "3175031234567890", "namaLengkap": "John Doe"}'
```

### Test Data
Valid NIKs for testing:
- `3175031234567890` - John Doe
- `3175032345678901` - Jane Smith
- `3175033456789012` - Ahmad Rahman
- `1234567890123456` - Test User One
- `1234567890123457` - Test User Two

## 🐳 Docker

### Quick Start
```bash