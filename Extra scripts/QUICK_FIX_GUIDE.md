# Quick Start - Backend Fixed! 🎉

## ✅ What Was Fixed

1. **404 Errors on `/api/students`** - Fixed routing issue (double `/api` prefix)
2. **Server Shutdown** - Backend now stays running persistently
3. **Port Conflicts** - Automatic cleanup of existing processes

---

## 🚀 How to Run (SIMPLE!)

### Just run this ONE command:

```bash
cd /home/divyansh/Hack-IIIT
./install_and_run.sh
```

**That's it!** This script will:
- ✅ Kill any existing backend processes automatically
- ✅ Install/update dependencies
- ✅ Start the backend servers
- ✅ Open the enrollment UI in your browser

**No more manual steps needed!**

---

## ✅ Verify Everything Works

```bash
./verify_backend.sh
```

Expected output:
```
Testing GET /health... ✓ 200 OK
Testing GET /api/students... ✓ 200 OK
Testing POST /api/students... ✓ 200 OK
Testing WebSocket ws://127.0.0.1:8765... ✓ Connected
Backend process status... ✓ Running
```

---

## 🛑 Stop Backend

```bash
./stop_backend.sh
```

---

## 📊 Backend Status

After running `install_and_run.sh`, your backend will be running at:

- **HTTP API:** http://127.0.0.1:8000
- **WebSocket:** ws://127.0.0.1:8765
- **Enrollment UI:** http://127.0.0.1:8000

### Available Endpoints:

✅ `GET /health` - Health check  
✅ `GET /api/students` - List students  
✅ `POST /api/students` - Add student  
✅ `PUT /api/students/{id}` - Update student  
✅ `DELETE /api/students/{id}` - Delete student  
✅ `POST /api/students/{id}/enroll` - Enroll with audio  

---

## 🔧 Troubleshooting

### Backend won't start?
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :8765

# Kill them manually
lsof -ti:8000 | xargs -r kill -9
lsof -ti:8765 | xargs -r kill -9

# Then run again
./install_and_run.sh
```

### Check logs:
```bash
tail -f backend.log
```

---

## 📝 Summary

**Before Fix:**
- ❌ GET /api/students → 404 Not Found
- ❌ POST /api/students → 404 Not Found
- ❌ Server shuts down after requests

**After Fix:**
- ✅ GET /api/students → 200 OK
- ✅ POST /api/students → 200 OK
- ✅ Server stays running
- ✅ Automatic port cleanup
- ✅ One-command startup

---

**You're all set! Just run `./install_and_run.sh` and you're good to go!** 🚀
