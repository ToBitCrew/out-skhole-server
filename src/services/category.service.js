const catRepo = require('../repositories/category.repository');

const getTree = async () => {
  const [majors, mids, subs] = await Promise.all([
    catRepo.getMajors(),
    catRepo.getMids(),
    catRepo.getSubs(),
  ]);

  return majors.map((maj) => ({
    major_cat_cd: maj.major_cat_cd,
    cat_major_nm: maj.cat_major_nm,
    mid_categories: mids
      .filter((m) => m.major_cat_cd === maj.major_cat_cd)
      .map((mid) => ({
        mid_cat_cd: mid.mid_cat_cd,
        mid_cat_nm: mid.mid_cat_nm,
        sub_categories: subs
          .filter((s) => s.major_cat_cd === mid.major_cat_cd && s.mid_cat_cd === mid.mid_cat_cd)
          .map((s) => ({ sub_cat_cd: s.sub_cat_cd, sub_cat_nm: s.sub_cat_nm })),
      })),
  }));
};

module.exports = { getTree };
