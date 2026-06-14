const catRepo = require('../repositories/category.repository');

const getTree = async () => {
  const [majors, mids, subs] = await Promise.all([
    catRepo.getMajors(),
    catRepo.getMids(),
    catRepo.getSubs(),
  ]);

  return majors.map((maj) => ({
    cat_major_cd: maj.cat_major_cd,
    cat_major_nm: maj.cat_major_nm,
    mid_categories: mids
      .filter((m) => m.cat_major_cd === maj.cat_major_cd)
      .map((mid) => ({
        cat_mid_cd: mid.cat_mid_cd,
        cat_mid_nm: mid.cat_mid_nm,
        sub_categories: subs
          .filter((s) => s.cat_major_cd === mid.cat_major_cd && s.cat_mid_cd === mid.cat_mid_cd)
          .map((s) => ({ cat_sub_cd: s.cat_sub_cd, cat_sub_nm: s.cat_sub_nm })),
      })),
  }));
};

module.exports = { getTree };
