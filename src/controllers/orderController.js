const menus = require('../data/menus.json');

/**
 * Format angka ke format Rupiah
 */
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Deskripsi level kepedasan
 */
const getSpicyDescription = (level) => {
  const parsed = parseInt(level, 10);
  switch (parsed) {
    case 0:
      return 'Level 0 (Tidak Pedas)';
    case 1:
      return 'Level 1 (Pedas Santai)';
    case 2:
      return 'Level 2 (Pedas Sedang)';
    case 3:
      return 'Level 3 (Pedas Mantap)';
    case 4:
      return 'Level 4 (Pedas Nampol)';
    case 5:
      return 'Level 5 (Sangat Pedas / Mampus)';
    default:
      return `Level ${parsed || 0}`;
  }
};

/**
 * Controller checkout pesanan & generator WhatsApp Click-to-Chat URL
 */
const checkoutOrder = (req, res) => {
  try {
    const { customerName, orderType, spicyLevel, notes, items } = req.body;

    // Validasi kelengkapan data
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

    // Hitung total harga dan susun rincian menu
    let totalPrice = 0;
    const menuListLines = [];

    items.forEach((item) => {
      const quantity = Math.max(1, parseInt(item.qty, 10) || 1);
      
      // Cocokkan dengan data menu jika ada menuId
      let itemPrice = Number(item.harga) || 0;
      let itemName = item.nama || 'Item Menu';

      if (item.menuId) {
        const found = menus.find((m) => m.id === Number(item.menuId));
        if (found) {
          itemPrice = found.harga;
          itemName = found.nama;
        }
      }

      const itemSubtotal = itemPrice * quantity;
      totalPrice += itemSubtotal;

      menuListLines.push(`- ${quantity}x ${itemName} (${formatRupiah(itemSubtotal)})`);
    });

    const parsedOrderType = orderType ? orderType.trim() : 'Bungkus (Takeaway)';
    const parsedSpicyLevel = getSpicyDescription(spicyLevel !== undefined ? spicyLevel : 2);
    const parsedNotes = notes && notes.trim() ? notes.trim() : '-';

    // Susun pesan WhatsApp sesuai template PRD Bagian 5.3
    const waMessageLines = [
      '🔥 *PESANAN BARU - SEBLAK MAK EUNIN* 🔥',
      '----------------------------------------',
      `*Nama Pemesan:* ${customerName.trim()}`,
      `*Opsi Pesanan:* ${parsedOrderType}`,
      `*Tingkat Kepedasan:* ${parsedSpicyLevel}`,
      `*Catatan:* ${parsedNotes}`,
      '',
      '📋 *Daftar Menu:*',
      ...menuListLines,
      '',
      '----------------------------------------',
      `💰 *Total Pembayaran:* ${formatRupiah(totalPrice)}`,
      '----------------------------------------',
      'Mohon segera dikonfirmasi ya, terima kasih! 🙏'
    ];

    const waMessageText = waMessageLines.join('\n');

    // Nomor WhatsApp warung (bisa dikonfigurasi via environment variable)
    const rawPhoneNumber = process.env.WA_PHONE_NUMBER || '6281234567890';
    // Hapus karakter non-digit dan format ke awalan nomor internasional
    let cleanPhone = rawPhoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessageText)}`;

    return res.status(200).json({
      success: true,
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
  getSpicyDescription
};
