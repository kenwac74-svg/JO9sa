import sys,unittest,tempfile,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
sys.path.append('G:/somi/JO9sa/tools/modding-hub')
from game_presentation import metadata,read_metadata
from master_editor import make_fixture

class DisplayTests(unittest.TestCase):
 def fixture(self):
  return make_fixture({'#static_base':"$_font_col_skill[4] = '<font color=\"#009FEF\">'\r\n$update_slave_features_list = {\r\n $x = dyneval($vb_cycle_skill, 4, 'Old')\r\n}",'#variative':'cont_atr_threshold[1] = 10\r\ncont_atr_threshold[2] = 20', 'jo9_traits':'''$result += '<a href="EXEC: gs ''jo9_traits'', ''describe'', ''healthy''">건강체질</a><br>' '''})
 def test_trait_profile_grade_overrides_unstyled_game_link(self):
  d=metadata(self.fixture(),'var grades = {healthy:4};','.jo9_tv_entry[data-grade="4"] *{color:#009fef!important}.jo9_tv_entry[data-kind="title"] *{color:#5c351d!important}')
  self.assertEqual(d['traitColors']['건강체질'],'#009fef');self.assertEqual(d['titleColor'],'#5c351d');self.assertEqual(d['continuousThresholds'][:3],[0,10,20])
 def test_cache_includes_game_trait_stylesheet(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);q=root/'jack.qsp';q.write_bytes(self.fixture());(root/'content/js').mkdir(parents=True);(root/'css').mkdir()
   (root/'content/js/jo9_traits_view.js').write_text('var grades = {healthy:4};')
   css=root/'css/jo9_traits_view.css';css.write_text('.jo9_tv_entry[data-grade="4"] *{color:#123456!important}')
   self.assertEqual(read_metadata(q)['traitColors']['건강체질'],'#123456')
   old=css.stat().st_mtime_ns;css.write_text('.jo9_tv_entry[data-grade="4"] *{color:#654321!important}');os.utime(css,ns=(old+1000000,old+1000000))
   self.assertEqual(read_metadata(q)['traitColors']['건강체질'],'#654321')

if __name__=='__main__':unittest.main()
