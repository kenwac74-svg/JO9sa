# 아그라바 특별 식재료

이 패치는 `patch.json`에 기록된 WORK QSP를 기준으로 생성한다. 게임을 종료한 뒤 후보의 해시를 확인하고 `install.ps1`로 교체하면, 교체 전 QSP가 게임 폴더의 `_backup_before_agraba_…`에 남는다.

특등급 처녀고기는 일반 요리 재료인 `fridge['virgin_meat']`와 별개인 `jo9_agraba_stock['premium_virgin_meat']`다. 획득 이벤트가 추가되면 이벤트의 지급 분기에서 아래 명령을 한 번 호출한다. 이 패치에서는 호출하는 획득 이벤트를 추가하지 않았다.

```qsp
gs 'jo9_agraba_food_reward', 'premium_virgin_meat'
```

한 호출에 12회분을 지급한다. 특별요리 명령을 켠 조수가 식사를 준비하면 과일, 와인, 특등급 처녀고기 순서로 사용 가능한 재료를 확인한다. 재료를 써서 한 단계 높아진 식사가 당일 최종 식사가 된 경우에만 1회분을 차감한다. 조리 숙련도에는 원래 조리 등급을 쓴다.
