import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JsBarcode from 'jsbarcode'; 

const itemCategories = ['plastic pertanian', 'plastic kemasan', 'sembako', 'bahan kue'];

// --- Komponen Keypad (Diperbesar dan Full-Width) ---
const Keypad = ({ onNumberClick, onClear }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', margin: '15px auto 0' }}>
        {[
            1, 2, 3, 
            4, 5, 6, 
            7, 8, 9, 
            0 // Tombol 0 ada di baris terakhir dan akan menempati 2 kolom
        ].map(num => (
            <button 
                key={num} 
                onClick={() => onNumberClick(num)} 
                style={{ 
                    padding: '25px', 
                    fontSize: '30px', 
                    backgroundColor: '#333', 
                    color: 'var(--color-text-light)', 
                    borderRadius: '8px',
                    height: 'auto',
                    // Logic pemusatan tombol '0' di baris terakhir dengan span 2 kolom
                    gridColumn: num === 0 ? '1 / span 3' : 'auto', 
                }}
            >
                {num}
            </button>
        ))}
        {/* Tambahkan elemen kosong untuk melengkapi baris jika tombol '0' hanya span 2 */}
        <div style={{ visibility: 'hidden', height: '0px' }}></div> 

        {/* Tombol CLEAR menggunakan span 3 kolom di baris paling bawah */}
        <button onClick={onClear} style={{ gridColumn: 'span 3', padding: '20px', backgroundColor: 'var(--color-danger)', fontSize: '24px', borderRadius: '8px' }}>
           HAPUS
        </button>
    </div>
);

// ---------------------------------------

function CetakBarcodePage() {
    const [activeCategory, setActiveCategory] = useState(itemCategories[0]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(''); 
    const [beratInput, setBeratInput] = useState(''); 
    
    // State untuk memicu rendering barcode di area tersembunyi
    const [barcodeResult, setBarcodeResult] = useState(''); 
    const [itemDetail, setItemDetail] = useState(null); 
    const [beratKg, setBeratKg] = useState(''); // State untuk menyimpan berat dalam format KG

    // Ref untuk elemen SVG di dalam area cetak tersembunyi
    const barcodeRef = useRef(null); 

    // --- Efek untuk mengambil data item ---
    useEffect(() => {
        const fetchItems = async () => {
            try {
                // Ganti dengan endpoint API Anda yang sebenarnya
                const response = await axios.get('/api/items'); 
                setItems(response.data);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };
        fetchItems();
    }, []);

    // --- Efek untuk memfilter item dan mengatur item pertama ---
    useEffect(() => {
        const filtered = items.filter(item => item.jenis === activeCategory);
        setFilteredItems(filtered);
        setBeratInput('');
        setBeratKg('');

        if (filtered.length > 0) {
            setSelectedItem(filtered[0]._id); 
            setItemDetail(filtered[0]);
        } else {
            setSelectedItem('');
            setItemDetail(null);
        }
        setBarcodeResult('');
    }, [activeCategory, items]);
    
    // --- Efek BARCODE RENDERING dan CETAK (Kunci Stabilitas) ---
    useEffect(() => {
        if (barcodeRef.current && barcodeResult && itemDetail) {
            try {
                // 1. Gambar Barcode menggunakan JsBarcode ke Ref (di DOM utama yang tersembunyi)
                JsBarcode(barcodeRef.current, barcodeResult, {
                    format: "CODE128", 
                    displayValue: false,
                    margin: 2,
                    width: 1.5,
                    height: 40,
                });

                // 2. Tunggu sebentar agar browser selesai menggambar SVG di DOM utama
                setTimeout(() => {
                    printLabel(); // Panggil fungsi cetak
                }, 100); 

            } catch (e) {
                console.error("Error rendering barcode for print:", e);
                alert("Gagal merender barcode. Cek konsol.");
            }
        }
    }, [barcodeResult, itemDetail]);

    // --- Handler Keypad ---
    const handleKeypadInput = (num) => {
        if (beratInput.length < 6) { 
            const newBerat = String(beratInput) + String(num);
            setBeratInput(newBerat);
            
            // Konversi ke KG dengan 2 digit desimal (misal: 250 -> 0.25)
            const beratGram = parseInt(newBerat);
            if (!isNaN(beratGram) && beratGram > 0) {
                setBeratKg((beratGram / 1000).toFixed(2) + " KG"); 
            } else {
                setBeratKg("");
            }
        }
    };
    
    const handleClear = () => {
        setBeratInput('');
        setBeratKg('');
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item._id);
        setItemDetail(item);
    };

    // --- Fungsi Pencetakan DOM (Perbaikan CSS Paling Stabil) ---
    const printLabel = () => {
        const printContent = document.getElementById('print-content-wrapper').innerHTML;
        
        const styles = `
            <style>
                @page { 
                    size: 50mm 35mm; 
                    margin: auto; 
                }
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: white; 
                    color: black;
                }
                
                /* KUNCI STABILITAS: Pemusatan Absolut dan Ukuran Paksa */
                #print-content-wrapper { 
                    width: 50mm; 
                    height: 35mm; 
                    box-sizing: border-box; 
                    padding: 2mm; 
                    margin: 0; 
                    
                    /* Pemusatan Absolut 2D yang Andap */
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%); 
                    
                    text-align: center;
                    font-family: Arial, sans-serif;
                    
                    /* Mengatur layout konten internal */
                    display: flex; 
                    flex-direction: column; 
                    justify-content: space-between;
                    align-items: center; 
                }

                /* Gaya Konten Internal */
                .item-info { 
                    font-size: 9px; 
                    font-weight: bold; 
                    margin: 0; 
                    padding: 0; 
                    width: 100%;
                    text-align: center; 
                }
                .berat-info {
                    font-size: 9px;
                    margin: 0; 
                    padding: 0;
                    width: 100%;
                    text-align: center; 
                }

                /* Teks Barcode di Tengah */
                .barcode-text { 
                    font-size: 11px; 
                    font-weight: bold; 
                    margin-top: 2px; 
                    padding: 0; 
                    width: 100%; 
                    display: block;
                    text-align: center; 
                }
                
                /* Gaya SVG Barcode (Ukuran Tetap untuk Stabilitas) */
                svg { 
                    width: 45mm !important; 
                    height: 15mm !important; 
                    margin: 1mm auto; 
                    display: block; 
                } 
            </style>
        `;

        const newWindow = window.open('', '_blank');
        
        newWindow.document.open(); 
        newWindow.document.write('<html><head>' + styles + '</head><body>' + printContent + '</body></html>');
        newWindow.document.close(); 

        newWindow.onload = () => {
            setTimeout(() => {
                newWindow.focus(); 
                newWindow.print();
                newWindow.close();
            }, 150); 
        };
        
        if (newWindow.document.readyState === 'complete') {
            newWindow.onload();
        }
    };

    // --- Handler Tombol CETAK ---
    const handleCetak = async () => {
        const berat = parseInt(beratInput);
        const currentItem = items.find(item => item._id === selectedItem);

        if (!currentItem || !beratInput || isNaN(berat)) {
            alert("Pilih item dan masukkan berat yang valid (angka).");
            return;
        }

        try {
            // 1. Panggil API Backend (Sesuaikan dengan endpoint Anda)
            const response = await axios.post('/api/barcode', {
                kode_item: currentItem.kode,
                berat: berat
            });
            
            const finalBarcodeString = response.data.barcode;
            
            // 2. ATUR STATE BARCODE. Ini akan memicu useEffect untuk merender SVG dan mencetak.
            setItemDetail(currentItem);
            setBarcodeResult(finalBarcodeString); 
            
        } catch (error) {
            alert('Gagal mencetak barcode. Cek konsol.');
            console.error('Error generating barcode:', error.response ? error.response.data : error.message);
        }
    };

    return (
        <div className="cetak-barcode-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
            

            {/* SUB MENU KATEGORI */}
            <div style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {itemCategories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)} 
                        style={{ 
                            padding: '12px 20px',
                            border: cat === activeCategory ? `2px solid var(--color-primary-blue)` : '1px solid #444',
                            backgroundColor: cat === activeCategory ? '#333' : 'var(--color-card-bg)',
                            color: cat === activeCategory ? 'var(--color-primary-blue)' : 'var(--color-text-light)',
                            borderRadius: '20px',
                            fontWeight: 'bold'
                        }}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* KONTEN UTAMA DENGAN GRID FULL-WIDTH */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.2fr 1fr', 
                gap: '50px', 
                alignItems: 'start', 
                width: '100%',
                maxWidth: '1200px', 
                margin: '0 auto' 
            }}> 
                
                {/* Kolom 1: Pilihan Item (GRID KOTAK) */}
                <div style={{ 
                    backgroundColor: 'var(--color-card-bg)', 
                    padding: '25px', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
                }}>
                    <label style={{ display: 'block', marginBottom: '15px', color: 'var(--color-primary-blue)', fontWeight: 'bold', fontSize: '1.1em' }}>
                        1. PILIH ITEM (KATEGORI: {activeCategory.toUpperCase()})
                    </label>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                        gap: '12px', 
                        maxHeight: 'calc(100vh - 350px)', 
                        overflowY: 'auto', 
                        paddingRight: '10px' 
                    }}>
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                            <div
                                key={item._id}
                                onClick={() => handleItemSelect(item)}
                                style={{
                                    padding: '15px 10px', 
                                    border: selectedItem === item._id ? `3px solid var(--color-primary-blue)` : '1px solid #444',
                                    backgroundColor: selectedItem === item._id ? '#333' : '#222',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: selectedItem === item._id ? '0 0 12px rgba(0, 188, 212, 0.8)' : 'none',
                                }}
                            >
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: selectedItem === item._id ? 'var(--color-primary-blue)' : 'var(--color-text-light)' }}>
                                    {item.nama}
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-dim)' }}>
                                    Kode: {item.kode}
                                </p>
                            </div>
                        )) : (
                            <p style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                                Tidak ada item dalam kategori ini.
                            </p>
                        )}
                    </div>
                </div>

                {/* Kolom 2: Input Berat, Keypad, dan Tombol Cetak (Fokus Utama) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--color-card-bg)', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)' }}>
                    <label htmlFor="berat-input" style={{ marginBottom: '20px', color: 'var(--color-primary-blue)', fontWeight: 'bold', fontSize: '1.2em' }}>
                        2. INPUT BERAT & CETAK
                    </label>
                    <input 
                        id="berat-input"
                        type="text" 
                        value={beratInput} 
                        readOnly 
                        maxLength="6" 
                        placeholder="000000"
                        style={{ width: '100%', padding: '25px', textAlign: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '20px', borderRadius: '8px' }}
                    />
                    
                    {beratKg && (
                        <p style={{ fontSize: '1.2em', color: 'var(--color-success)', fontWeight: 'bold', marginBottom: '15px' }}>
                            Format KG: {beratKg}
                        </p>
                    )}
                    
                    <Keypad onNumberClick={handleKeypadInput} onClear={handleClear} />

                    <button 
                        onClick={handleCetak} 
                        disabled={!selectedItem || beratInput.length === 0}
                        style={{ padding: '20px 30px', backgroundColor: 'var(--color-success)', marginTop: '40px', width: '100%', fontSize: '1.5em', borderRadius: '8px' }}
                    >
                        CETAK LABEL
                    </button>
                </div>
            </div>
            
            {/* --- Hidden Container untuk Rendering Barcode Stabil --- */}
            <div id="print-area" style={{ display: 'none' }}>
                {barcodeResult && itemDetail && (
                    <div id="print-content-wrapper">
                        <p className="item-info">{itemDetail.nama.toUpperCase()}</p>
                        
                        {beratKg && <p className="berat-info">Berat: {beratKg}</p>}
                        
                        <svg ref={barcodeRef} style={{ width: '100%' }}></svg> 
                        <p className="barcode-text">**{barcodeResult}**</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CetakBarcodePage;
