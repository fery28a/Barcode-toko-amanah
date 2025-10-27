import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Daftar Jenis Item
const ITEM_TYPES = ['bahan kue', 'sembako', 'plastic pertanian', 'plastic kemasan', 'snack'];

function MasterDataPage() {
    // State untuk Form
    const [namaItem, setNamaItem] = useState('');
    const [jenisItem, setJenisItem] = useState(ITEM_TYPES[0]);
    const [kodeItem, setKodeItem] = useState(''); // Kode 4 digit
    const [itemIdToEdit, setItemIdToEdit] = useState(null); // ID item yang sedang diedit

    // State untuk Data Tabel
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fungsi Fetch Data (Read) ---
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/items');
            setItems(response.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Gagal memuat data master. Pastikan server backend berjalan di port 5045.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Fungsi Submit Form (Create/Update) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (kodeItem.length !== 4) {
            alert("Kode item harus tepat 4 digit.");
            return;
        }

        const itemData = { nama: namaItem, jenis: jenisItem, kode: kodeItem };

        try {
            if (itemIdToEdit) {
                // UPDATE (Edit) Logic
                const confirmUpdate = window.confirm(`Anda yakin ingin menyimpan perubahan pada item: ${itemData.nama}?`);
                if (!confirmUpdate) return;
                
                await axios.put(`/api/items/${itemIdToEdit}`, itemData);
                alert('Item berhasil diperbarui!');
                
            } else {
                // CREATE (Tambah) Logic
                await axios.post('/api/items', itemData);
                alert('Item baru berhasil ditambahkan!');
            }
            
            // Reset form dan muat ulang data
            setNamaItem('');
            setKodeItem('');
            setJenisItem(ITEM_TYPES[0]);
            setItemIdToEdit(null);
            fetchData(); 

        } catch (err) {
            const message = err.response?.data?.message || err.message;
            alert(`Gagal menyimpan item. Error: ${message}`);
            console.error('Submit Error:', err.response || err);
        }
    };

    // --- Fungsi Mulai Edit ---
    const handleEditStart = (item) => {
        setNamaItem(item.nama);
        setJenisItem(item.jenis);
        setKodeItem(item.kode);
        setItemIdToEdit(item._id); // Set ID untuk mode edit
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Fungsi Hapus (Delete) ---
    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus item "${nama}"? Data tidak dapat dikembalikan.`)) {
            return;
        }

        try {
            // DELETE Logic
            await axios.delete(`/api/items/${id}`);
            alert(`Item "${nama}" berhasil dihapus.`);
            fetchData();
            
        } catch (err) {
            alert('Gagal menghapus item. Cek konsol backend.');
            console.error('Delete Error:', err.response || err);
        }
    };

    // --- Fungsi Batal Edit ---
    const handleCancelEdit = () => {
        setNamaItem('');
        setKodeItem('');
        setJenisItem(ITEM_TYPES[0]);
        setItemIdToEdit(null);
    };

    return (
        <div className="master-data-container">
            <h2>{itemIdToEdit ? 'EDIT ITEM' : 'TAMBAH ITEM BARU'}</h2>
            
            {/* --- Form Input Item --- */}
            <form onSubmit={handleSubmit} style={{ 
                backgroundColor: 'var(--color-card-bg)', 
                padding: '25px', 
                borderRadius: '8px', 
                marginBottom: '40px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)' 
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr auto auto', gap: '15px', alignItems: 'center' }}>
                    
                    <input 
                        type="text" 
                        placeholder="Nama Item" 
                        value={namaItem} 
                        onChange={e => setNamaItem(e.target.value)} 
                        required
                    />
                    
                    <select 
                        value={jenisItem} 
                        onChange={e => setJenisItem(e.target.value)}
                        required
                    >
                        {ITEM_TYPES.map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                        ))}
                    </select>
                    
                    <input 
                        type="text" 
                        placeholder="Kode (4 digit)" 
                        value={kodeItem} 
                        onChange={e => setKodeItem(e.target.value.slice(0, 4))}
                        maxLength="4" 
                        required
                        disabled={itemIdToEdit} // Kode tidak bisa diubah saat edit
                        style={{ textAlign: 'center' }}
                    />

                    <button 
                        type="submit" 
                        style={{ backgroundColor: itemIdToEdit ? '#ffc107' : 'var(--color-primary-blue)', color: 'var(--color-dark-bg)' }}
                    >
                        {itemIdToEdit ? 'SIMPAN' : 'TAMBAH'}
                    </button>
                    
                    {itemIdToEdit && (
                        <button type="button" onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d', color: 'var(--color-dark-bg)' }}>
                            BATAL
                        </button>
                    )}
                </div>
            </form>
            
            {/* --- Output Data (Tabel) --- */}
            <h3 style={{ borderBottom: '1px solid var(--color-card-bg)' }}>DATA ITEM TERSIMPAN</h3>
            
            {loading && <p style={{ color: 'var(--color-primary-blue)' }}>Memuat data...</p>}
            {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

            {!loading && !error && (
                <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)' }}>
                    <table style={{ minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th>Nama Item</th>
                                <th>Jenis Item</th>
                                <th>Kode Item</th>
                                <th style={{ width: '150px', textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td>{item.nama}</td>
                                    <td>{item.jenis.toUpperCase()}</td>
                                    <td style={{ fontWeight: 'bold' }}>{item.kode}</td>
                                    <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                        <button 
                                            onClick={() => handleEditStart(item)}
                                            style={{ padding: '8px 12px', backgroundColor: '#17a2b8', minWidth: '60px', color: 'var(--color-dark-bg)' }}
                                        >
                                            EDIT
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item._id, item.nama)}
                                            style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger)', minWidth: '60px', color: 'var(--color-dark-bg)' }}
                                        >
                                            HAPUS
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// SOLUSI untuk error "does not provide an export named default"
export default MasterDataPage;