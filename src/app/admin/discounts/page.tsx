"use client";

import { useState } from "react";

import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";

const discounts = [
  ["롯데월드", "KT VIP", "통신사", "KT", "20%", "앱예매", "active", "high", "2025-12-31"],
  ["롯데월드", "신한카드", "카드", "신한카드", "30%", "현장결제", "active", "medium", "없음"],
  ["CGV", "SKT", "통신사", "SKT", "15%", "현장결제", "active", "high", "2025-11-30"],
] as const;

export default function AdminDiscountsPage() {
  const [benefitScope, setBenefitScope] = useState<"provider_all" | "product_specific">(
    "provider_all",
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Discounts</h1>
        <button type="button" className="btn btn-primary">
          + 할인 등록
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">할인 등록 (Mock)</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">적용 범위</label>
              <div className="d-flex gap-3">
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="benefit-scope"
                    value="provider_all"
                    checked={benefitScope === "provider_all"}
                    onChange={() => setBenefitScope("provider_all")}
                  />
                  <span className="form-check-label">제공사 전체</span>
                </label>
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="benefit-scope"
                    value="product_specific"
                    checked={benefitScope === "product_specific"}
                    onChange={() => setBenefitScope("product_specific")}
                  />
                  <span className="form-check-label">특정 혜택 상품</span>
                </label>
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label">혜택 상품</label>
              <select
                className="form-select"
                disabled={benefitScope === "provider_all"}
                defaultValue=""
              >
                <option value="">
                  {benefitScope === "provider_all"
                    ? "제공사 전체 선택 시 비활성화"
                    : "혜택 상품 선택"}
                </option>
                <option>KT VIP</option>
                <option>T멤버십 VIP</option>
                <option>신한카드 Deep Dream</option>
              </select>
              <div className="form-text">
                제공사 전체 선택 시 benefit_product_id는 저장되지 않습니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input className="form-control" placeholder="브랜드 검색" />
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">카테고리</option>
                <option>통신사</option>
                <option>카드</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">제공사</option>
                <option>KT</option>
                <option>SKT</option>
                <option>신한카드</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">상태</option>
                <option>active</option>
                <option>draft</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">신뢰도</option>
                <option>high</option>
                <option>medium</option>
                <option>low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>브랜드</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>제공사</th>
                <th>할인값</th>
                <th>방식</th>
                <th>상태</th>
                <th>신뢰도</th>
                <th>만료일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={`${discount[0]}-${discount[1]}`}>
                  <td>{discount[0]}</td>
                  <td>{discount[1]}</td>
                  <td>{discount[2]}</td>
                  <td>{discount[3]}</td>
                  <td>{discount[4]}</td>
                  <td>{discount[5]}</td>
                  <td>
                    <StatusBadge status={discount[6]} />
                  </td>
                  <td>
                    <ConfidenceBadge confidence={discount[7]} />
                  </td>
                  <td>{discount[8]}</td>
                  <td>
                    <button type="button" className="btn btn-outline-primary btn-sm">
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
