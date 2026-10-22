const menus = require('../data/menus.json');

/**
 * Format angka ke format Rupiah standar
 */
const formatRupiah = (amount) => {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace(/\u00a0/g, ' ');
};

/**
 * Deskripsi level kepedasan sesuai PRD-2 Bagian 3.2
 */
const getSpicyInfo = (level) => {
  const parsed = parseInt(level, 10);
  switch (parsed) {
    case 0:
      return { level: 0, label: 'Tidak Pedas', extraFee: 0 };
    case 1:
      return { level: 1, label: 'Pedas Santai', extraFee: 0 };
    case 2:
      return { level: 2, label: 'Pedas Sedang', extraFee: 0 };
    case 3:
      return { level: 3, label: 'Pedas Mantap', extraFee: 0 };
    case 4:
      return { level: 4, label: 'Pedas Nampol', extraFee: 2000 };
    case 5:
      return { level: 5, label: 'Sangat Pedas / Level Dewa', extraFee: 2000 };
    default:
      return { level: parsed || 0, label: `Level ${parsed || 0}`, extraFee: 0 };
  }
};

/**
 * Controller checkout pesanan & generator WhatsApp Click-to-Chat URL
 * Mengikuti spesifikasi PRD-2.md
 */
const checkoutOrder = (req, res) => {
  try {
    const { customerName, orderType, spicyLevel, notes, items } = req.body;

    // Validasi input pemesan
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama pemesan wajib diisi'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja tidak boleh kosong'
      });
    }

    const spicyInfo = getSpicyInfo(spicyLevel !== undefined ? spicyLevel : 2);
    let subtotalItems = 0;
    const rincianMenuLines = [];
    const toppingList = [];

    items.forEach((item) => {
      const quantity = Math.max(1, parseInt(item.qty, 10) || 1);
      
      let itemPrice = Number(item.harga) || 0;
      let itemName = item.nama || 'Item Menu';
      let itemCategory = item.kategori || '';

      if (item.menuId) {
        const found = menus.find((m) => String(m.id) === String(item.menuId));
        if (found) {
          itemPrice = found.harga;
          itemName = found.nama;
          itemCategory = found.kategori;
        }
      }

      const itemSubtotal = itemPrice * quantity;
      subtotalItems += itemSubtotal;

      // Catat topping terpisah untuk section *Tambahan Topping:*
      if (itemCategory === 'Pilih Topping' || String(item.menuId).startsWith('T')) {
        toppingList.push(`${quantity}x ${itemName}`);
      }

      rincianMenuLines.push(`${itemName} (x${quantity}) - ${formatRupiah(itemSubtotal)}`);
    });

    // Tambahan biaya pedas jika Level 4 atau 5 (PRD-2 Section 3.2)
    const extraSpicyFee = spicyInfo.extraFee;
    if (extraSpicyFee > 0) {
      rincianMenuLines.push(`Biaya Ekstra Pedas (Lv ${spicyInfo.level}) - ${formatRupiah(extraSpicyFee)}`);
    }

    const totalPrice = subtotalItems + extraSpicyFee;
    const parsedOrderType = orderType && orderType.trim() ? orderType.trim() : 'Bungkus';
    const parsedNotes = notes && notes.trim() ? notes.trim() : '-';
    const parsedTopping = toppingList.length > 0 ? toppingList.join(', ') : '-';

    // Format Template Pesan WhatsApp sesuai PRD-2 Bagian 1.2
    const waMessageLines = [
      '*PESANAN BARU - SEBLAK MAK EUNIN*',
      '----------------------------------------',
      `*Nama Pemesan:* ${customerName.trim()}`,
      `*Tipe Pesanan:* ${parsedOrderType}`,
      `*Level Pedas:* Lv ${spicyInfo.level} (${spicyInfo.label})`,
      `*Tambahan Topping:* ${parsedTopping}`,
      `*Catatan Khusus:* ${parsedNotes}`,
      '',
      '*Rincian Menu:*',
      ...rincianMenuLines,
      '',
      '----------------------------------------',
      `*Total Pembayaran:* ${formatRupiah(totalPrice)}`,
      '----------------------------------------',
      'Mohon ditunggu, pesanan sedang diproses ya! 🙏'
    ];

    const waMessageText = waMessageLines.join('\n');

    // Ambil nomor WA admin dari environment variable sesuai PRD-2 Bagian 1.1
    const rawPhoneNumber =
      process.env.WA_ADMIN_NUMBER ||
      process.env.WA_PHONE_NUMBER ||
      '6283824468119';

    let cleanPhone = rawPhoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessageText)}`;

    return res.status(200).json({
      success: true,
      subtotal: subtotalItems,
      extraSpicyFee,
      totalPrice,
      waUrl,
      formattedMessage: waMessageText
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses checkout pesanan',
      error: error.message
    });
  }
};

module.exports = {
  checkoutOrder,
  formatRupiah,
  getSpicyInfo
};
