import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ITEM_TYPES = [
    'bahan kue', 
    'sembako', 
    'plastic pertanian', 
    'plastic kemasan', 
    'snack',      // <<< Kategori Baru
    'bumbu'       // <<< Kategori Baru
];

function MasterDataPage() {
    // --- State dan Fungsi (Tetap Sama) ---
    const [namaItem, setNamaItem] = useState('');
    const [jenisItem, setJenisItem] = useState(ITEM_TYPES[0]);
    const [kodeItem, setKodeItem] = useState('');
    const [itemIdToEdit, setItemIdToEdit] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fungsi Fetch data dari backend
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/items');
            setItems(response.data);
        } catch (err) {
            setError('Gagal memuat data master. Pastikan server backend berjalan di port 5045.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Efek saat komponen dimuat
    useEffect(() => {
        fetchData();
    }, []);

    // Handler Submit (Tambah/Edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { nama: namaItem, jenis: jenisItem, kode: kodeItem };

        try {
            if (itemIdToEdit) {
                await axios.put(`/api/items/${itemIdToEdit}`, data);
                alert('Item berhasil diupdate!');
            } else {
                await axios.post('/api/items', data);
                alert('Item berhasil ditambahkan!');
            }
            // Reset form dan refresh data
            setNamaItem('');
            setKodeItem('');
            setItemIdToEdit(null);
            fetchData();
        } catch (error) {
            alert(`Gagal menyimpan item. Error: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    // Handler Mulai Edit
    const handleEditStart = (item) => {
        setNamaItem(item.nama);
        setJenisItem(item.jenis);
        setKodeItem(item.kode);
        setItemIdToEdit(item._id);
    };

    // Handler Hapus
    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus item: ${nama}?`)) {
            try {
                await axios.delete(`/api/items/${id}`);
                alert('Item berhasil dihapus!');
                fetchData();
            } catch (error) {
                alert('Gagal menghapus item.');
                console.error(error);
            }
        }
    };

    // Handler Batal Edit
    const handleCancelEdit = () => {
        setNamaItem('');
        setJenisItem(ITEM_TYPES[0]);
        setKodeItem('');
        setItemIdToEdit(null);
    };

    return (
        <div className="master-data-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
            <h2>{itemIdToEdit ? 'EDIT ITEM' : 'TAMBAH ITEM BARU'}</h2>
            
            {/* --- Form Input Item (Full-Width Grid) --- */}
            <form onSubmit={handleSubmit} style={{ 
                backgroundColor: 'var(--color-card-bg)', 
                padding: '25px', 
                borderRadius: '8px', 
                marginBottom: '40px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)' 
            }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(200px, 3fr) minmax(150px, 2fr) 1fr auto auto', 
                    gap: '15px', 
                    alignItems: 'center' 
                }}>
                    
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
                        disabled={itemIdToEdit} 
                        style={{ textAlign: 'center' }}
                    />

                    <button 
                        type="submit" 
                        style={{ padding: '12px 15px', backgroundColor: itemIdToEdit ? '#ffc107' : 'var(--color-primary-blue)', color: 'var(--color-dark-bg)' }}
                    >
                        {itemIdToEdit ? 'SIMPAN' : 'TAMBAH'}
                    </button>
                    
                    {itemIdToEdit && (
                        <button type="button" onClick={handleCancelEdit} style={{ padding: '12px 15px', backgroundColor: '#6c757d', color: 'var(--color-dark-bg)' }}>
                            BATAL
                        </button>
                    )}
                </div>
            </form>
            
            {/* --- Output Data (Tabel Full-Width) --- */}
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
                                <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td>{item.nama}</td>
                                    <td>{item.jenis.toUpperCase()}</td>
                                    <td style={{ fontWeight: 'bold' }}>{item.kode}</td>
                                    <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEditStart(item)}
                                            style={{ padding: '8px 12px', backgroundColor: '#17a2b8', minWidth: '70px', color: 'var(--color-dark-bg)' }}
                                        >
                                            EDIT
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item._id, item.nama)}
                                            style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger)', minWidth: '70px', color: 'var(--color-dark-bg)' }}
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

export default MasterDataPage;
