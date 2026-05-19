# 삼성카드 카드고릴라 vs 리포 시드 — alias 검토 목록

생성 유틸에서 **canon 키(표기 무시 근사)** 로 동일 간주한 매칭입니다. DB에 새 행을 추가하지 않고, 이름 정규화·별칭 매핑 UI 등을 검토할 때 활용합니다.

| benefit_type | 카드고릴라 이름 | 리포 내 기존 name | 코드 |
|---|---|---|---|
| credit | taptap DIGITAL | 삼성카드 taptap DIGITAL | `samsung_cred_taptap_digital` |
| credit | taptap DRIVE | 삼성카드 taptap DRIVE | `samsung_cred_taptap_drive` |
| credit | taptap SHOPPING | 삼성카드 taptap SHOPPING | `samsung_cred_taptap_shopping` |

생성 통계 전체는 `samsung_cards_upsert.sql` 헤더 주석 참고.
