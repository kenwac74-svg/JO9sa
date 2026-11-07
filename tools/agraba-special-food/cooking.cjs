'use strict';

const lines = (...parts) => parts.join('\r\n');

function patchCooking({ edit, text }) {
  const choice = '$food_choice';
  edit(choice,
    '!Expects quality level [0,5] as args[0]',
    lines(
      '!Expects quality level [0,5] as args[0]',
      "!Only actual assistant meal preparation supplies $args[1] = 'assistant'."
    ),
    'Document the assistant-only meal preparation argument');

  edit(choice,
    '	cooked_food = 0 &! canned food will not kill the slaver; unlike no food (-1) which can drain strength to zero',
    lines(
      '	cooked_food = 0 &! canned food will not kill the slaver; unlike no food (-1) which can drain strength to zero',
      "	$jo9_agraba_meal_bonus = ''",
      "	$jo9_agraba_meal_id = ''",
      '	jo9_agraba_meal_raw = 0'
    ),
    'Clear an old reservation when a new day starts with canned food');

  edit(choice,
    lines(
      '				! now check if this meal that we made is better than any meal we previously made today',
      '				if meal_quality > cooked_food:',
      '					! it is better, so replace the old meal with the new one',
      '					cooked_food = meal_quality',
      '					cooked_food_plus = meal_quality &! for end of day scene text',
      '					$cooked_meal = $try',
      '					cooked_food = 100 &! exit signal',
      '				end'
    ),
    lines(
      '				local jo9_agraba_meal_grade = meal_quality',
      "				local $jo9_agraba_candidate_bonus = ''",
      "				if $args[1] = 'assistant' and assistant['special_cooks_rule'] = 1 and meal_quality < 5 and meal_quality + 1 > cooked_food:",
      "					if jo9_agraba_stock['fruit'] > 0:",
      "						$jo9_agraba_candidate_bonus = 'fruit'",
      "					elseif jo9_agraba_stock['wine'] > 0:",
      "						$jo9_agraba_candidate_bonus = 'wine'",
      "					elseif jo9_agraba_stock['premium_virgin_meat'] > 0:",
      "						$jo9_agraba_candidate_bonus = 'premium_virgin_meat'",
      '					end',
      "					if $jo9_agraba_candidate_bonus ! '': jo9_agraba_meal_grade += 1",
      '				end',
      '',
      '				! At equal quality, keep a meal that does not need a premium ingredient.',
      "				if jo9_agraba_meal_grade > cooked_food or (jo9_agraba_meal_grade = cooked_food and $jo9_agraba_candidate_bonus = '' and $jo9_agraba_meal_bonus ! '' and $jo9_agraba_meal_id = $cooked_meal and cooked_food = jo9_agraba_meal_raw + 1):",
      '					cooked_food_plus = jo9_agraba_meal_grade',
      '					$cooked_meal = $try',
      '					$jo9_agraba_meal_bonus = $jo9_agraba_candidate_bonus',
      "					$jo9_agraba_meal_id = iif($jo9_agraba_candidate_bonus ! '', $try, '')",
      "					jo9_agraba_meal_raw = iif($jo9_agraba_candidate_bonus ! '', meal_quality, 0)",
      '					cooked_food = 100 &! exit signal',
      '				end'
    ),
    'Choose the winning meal with its effective grade and reserve at most one ingredient');

  edit(choice,
    '		if cooked_food = 100: cooked_food = meal_quality & exit &! outer loop',
    '		if cooked_food = 100: cooked_food = cooked_food_plus & exit &! outer loop',
    'Restore the effective meal grade while preserving the raw training grade');

  const assistantAutoCall = text('next_day').match(/^\tassistant_auto_cook = 1[^\r\n]*\r\n\t[^\r\n]*\r\n\tgs '\$food_choice', slave_skill[^\r\n]*/m)?.[0];
  if (!assistantAutoCall) throw new Error('Unable to locate the assistant-only food_choice call');
  edit('next_day', assistantAutoCall,
    assistantAutoCall.replace("gs '$food_choice', slave_skill", "gs '$food_choice', slave_skill, 'assistant'"),
    'Pass the actual overnight cooking actor');

  const manualCall = "gs '$food_choice', func('jo9_traits_personality', 'performance', 'dynslave', '', slave_skill)";
  const manualCache = lines(
    "if code_defined['interaction_serve_prepare_meal'] = 0:",
    "\tcode_defined['interaction_serve_prepare_meal'] = 1 &! do-once"
  );
  edit('interaction', manualCache, lines(
    "if code_defined['interaction_serve_prepare_meal'] < 2:",
    "\tcode_defined['interaction_serve_prepare_meal'] = 2 &! refresh the saved template for special cooking"
  ), 'Refresh the old manual cooking template from existing saves');
  edit('interaction', manualCall, manualCall + ", 'dynslave'", 'Pass the actual manual cooking actor');

  const dinnerFlag = "if cooked_food >= 0: master_eats_dinner = 1 &! flag for end_day_screen to show dinner scene (skipped if no one prepared food or if master ate already and the home meal is not higher quality)";
  edit('next_day', dinnerFlag, lines(
    'jo9_agraba_dinner_raw = 0',
    'jo9_agraba_dinner_grade = 0',
    "if $jo9_agraba_meal_bonus ! '' and $jo9_agraba_meal_id = $cooked_meal and cooked_food = jo9_agraba_meal_raw + 1:",
    '	if jo9_agraba_stock[$jo9_agraba_meal_bonus] > 0:',
    '		jo9_agraba_stock[$jo9_agraba_meal_bonus] -= 1',
    '		jo9_agraba_dinner_raw = jo9_agraba_meal_raw',
    '		jo9_agraba_dinner_grade = cooked_food',
    '	else',
    '		cooked_food = jo9_agraba_meal_raw',
    '		cooked_food_plus = cooked_food',
    '	end',
    'end',
    "$jo9_agraba_meal_bonus = ''",
    "$jo9_agraba_meal_id = ''",
    'jo9_agraba_meal_raw = 0',
    '',
    dinnerFlag
  ), 'Charge the retained meal once before any dinner effects');

  const prepText = "dynamic $replace(\"$text = '  <<$slave_cook_description[min(slave_skill, cooked_food_plus)]>>'\", 'dyn'+'slave', 'assistant')";
  edit('end_day_screen', prepText,
    prepText.replace('min(slave_skill, cooked_food_plus)',
      'min(slave_skill, iif(jo9_agraba_dinner_raw > 0, jo9_agraba_dinner_raw, cooked_food_plus))'),
    'Keep assistant preparation narration based on the unboosted dish');

  const dinnerText = "$text = '  오늘 저녁 식사:<br> <center><<$meal_name[$cooked_meal]>></center>'";
  edit('end_day_screen', dinnerText, lines(
    'local $jo9_agraba_dinner_name = $meal_name[$cooked_meal]',
    '	if jo9_agraba_dinner_raw > 0 and jo9_agraba_dinner_grade = cooked_food_plus:',
    '		local jo9_agraba_dinner_raw_rank = iif(jo9_agraba_dinner_raw = 1, 1, jo9_agraba_dinner_raw * 2)',
    '		$jo9_agraba_dinner_name = $replace($jo9_agraba_dinner_name, $food_quality[jo9_agraba_dinner_raw_rank], $food_quality[jo9_agraba_dinner_grade * 2])',
    '	end',
    "	$text = '  오늘 저녁 식사:<br> <center><<$jo9_agraba_dinner_name>></center>'"
  ), 'Render the effective grade without changing the base recipe table');
}

module.exports = { patchCooking };
