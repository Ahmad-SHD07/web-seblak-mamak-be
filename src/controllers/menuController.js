const menus = require('../data/menus.json');

/**
 * Controller untuk mengambil daftar menu
 * Mendukung filter query: ?kategori=seblak
 */
const getMenus = (req, res) => {
  try {
    const { kategori } = req.query;

    if (!kategori || kategori.trim().toLowerCase() === 'semua menu') {
      return res.status(200).json({
        success: true,
        data: menus
      });
    }

    const filtered = menus.filter((item) =>
      item.kategori.toLowerCase() === kategori.trim().toLowerCase()
    );

    return res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data menu',
      error: error.message
    });
  }
};

module.exports = {
  getMenus
};
