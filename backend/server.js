// Membaca variabel lingkungan dari file .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5045; // Port server Anda

// --- Konfigurasi Middleware ---
// Mengizinkan CORS (penting untuk komunikasi antara frontend:5173 dan backend:5045)
app.use(cors()); 
// Menggunakan JSON body parser untuk menangani data yang dikirim dari frontend
app.use(express.json()); 

// --- Koneksi MongoDB ---
// Mengambil URI koneksi dari file .env (mongodb://localhost:27017/weight_barcode_db)
const MONGODB_URI = process.env.MONGO_URI; 

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB!'))
.catch(err => {
    // Jika koneksi gagal, server akan menampilkan error di terminal
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Pastikan layanan MongoDB (mongod) berjalan dan MONGO_URI di .env sudah benar.');
    // Meskipun koneksi gagal, server Express akan tetap mencoba berjalan, namun API calls akan gagal.
});

// --- Definisikan SCHEMA Item ---
const itemSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    jenis: { 
        type: String, 
        enum: ['bahan kue', 'sembako', 'plastic pertanian', 'plastic kemasan', 'snack','bumbu'], 
        required: true 
    },
    // Kode harus 4 digit dan unik
    kode: { type: String, required: true, unique: true, maxlength: 4, minlength: 4 }, 
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

// ------------------------------------
// --- ROUTES (Master Data - CRUD) ---
// ------------------------------------

// 1. GET ALL (Read): Mengambil semua item
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        // Mengirim status 500 jika ada kegagalan saat querying database
        res.status(500).json({ message: 'Gagal memuat data item.', error: err.message });
    }
});

// 2. POST (Create): Menambah item baru
app.post('/api/items', async (req, res) => {
    const { nama, jenis, kode } = req.body;

    if (!kode || kode.length !== 4) {
        return res.status(400).json({ message: "Kode item harus 4 digit." });
    }

    try {
        const newItem = new Item({ nama, jenis, kode });
        const savedItem = await newItem.save();
        // Mengirim status 201 Created
        res.status(201).json(savedItem); 
    } catch (err) {
        if (err.code === 11000) {
            // MongoDB error code 11000: Duplicate key (kode item sudah ada)
            res.status(400).json({ message: "Kode item sudah digunakan. Mohon gunakan kode lain." });
        } else {
            res.status(400).json({ message: `Gagal menambah item. Detail: ${err.message}` });
        }
    }
});

// 3. PUT (Update): Mengedit item berdasarkan ID
app.put('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { nama, jenis, kode } = req.body;
    
    // Validasi sederhana, kode tidak boleh diubah jika sudah ada
    if (kode && kode.length !== 4) {
         return res.status(400).json({ message: "Kode item harus 4 digit." });
    }

    try {
        const updatedItem = await Item.findByIdAndUpdate(
            id, 
            { nama, jenis, kode }, 
            { new: true, runValidators: true } // new: mengembalikan dokumen yang sudah diupdate
        );
        
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }
        
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: `Gagal mengedit item. Detail: ${err.message}` });
    }
});

// 4. DELETE (Delete): Menghapus item berdasarkan ID
app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedItem = await Item.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }

        // Mengirim status 204 No Content (sukses tanpa mengembalikan body)
        res.status(204).send(); 
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus item.', error: err.message });
    }
});


// ------------------------------------------
// --- ROUTES (Barcode Generation Logic) ---
// ------------------------------------------

// Endpoint untuk menghasilkan barcode
app.post('/api/barcode', (req, res) => {
    const { kode_item, berat } = req.body; // kode_item: 4 digit, berat: angka

    if (!kode_item || !berat) {
        return res.status(400).json({ message: "Kode item dan berat harus disertakan." });
    }

    const beratString = String(berat);
    
    // Validasi berat maksimal 6 digit
    if (beratString.length > 6) {
        return res.status(400).json({ message: `Berat maksimal 6 digit. Input: ${beratString.length} digit.` });
    }
    
    // Format berat menjadi 6 digit (padding kiri dengan '0')
    const beratFormatted = beratString.padStart(6, '0');
    
    // Sistemasi Pencetakan Barcode: 20 + kode item (4 digit) + kode berat (6 digit)
    // Total panjang barcode: 2 + 4 + 6 = 12 digit
    const barcode = `20${kode_item}${beratFormatted}`;

    // Mengirim barcode yang sudah diformat kembali ke frontend
    res.json({ 
        barcode, 
        flag: '20',
        kode_item: kode_item,
        berat: beratFormatted,
        total_length: barcode.length 
    });
});


// --- Jalankan Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
});
