"use client";

import { useState } from "react";

import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const discounts = [
  ["롯데월드", "KT VIP", "통신사", "KT", "20%", "앱예매", "active", "high", "2025-12-31"],
  ["롯데월드", "신한카드", "카드", "신한카드", "30%", "현장결제", "active", "medium", "없음"],
  ["CGV", "SKT", "통신사", "SKT", "15%", "현장결제", "active", "high", "2025-11-30"],
  ["스타벅스", "신한카드 할인", "카드", "신한카드", "10%", "현장결제", "active", "low", "없음"],
  ["에버랜드", "KT VIP", "통신사", "KT", "25%", "앱예매", "active", "high", "2025-10-10"],
  ["서울랜드", "SKT", "통신사", "SKT", "12%", "현장결제", "active", "medium", "2025-09-01"],
  ["올리브영", "삼성카드", "카드", "삼성카드", "5%", "현장결제", "active", "medium", "없음"],
  ["다이소", "현대카드", "카드", "현대카드", "3%", "현장결제", "active", "low", "없음"],
  ["노브랜드", "하나카드", "카드", "하나카드", "7%", "현장결제", "active", "medium", "없음"],
  ["이케아", "국민카드", "카드", "국민카드", "8%", "현장결제", "active", "high", "없음"],
  ["쿠팡", "신한카드", "카드", "신한카드", "6%", "현장결제", "hidden", "low", "없음"],
  ["메가박스", "KT VIP", "통신사", "KT", "18%", "앱예매", "draft", "medium", "2025-08-01"],
  ["롯데시네마", "SKT", "통신사", "SKT", "14%", "현장결제", "active", "high", "2025-07-31"],
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

      <div className="sr-block card">
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

      <div className="sr-block card">
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

      <PaginatedTable
        title="할인 목록"
        legendType="discount"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "브랜드" },
          { header: "제목" },
          { header: "카테고리" },
          { header: "제공사" },
          { header: "할인값" },
          { header: "방식" },
          { header: "상태" },
          { header: "신뢰도" },
          { header: "만료일" },
          { header: "관리" },
        ]}
        rows={discounts.map((discount) => {
          const key = `${discount[0]}-${discount[1]}`;
          return [
            discount[0],
            discount[1],
            discount[2],
            discount[3],
            discount[4],
            discount[5],
            <StatusBadge key={`${key}-status`} status={discount[6]} />,
            <ConfidenceBadge key={`${key}-conf`} confidence={discount[7]} />,
            discount[8],
            <button key={`${key}-action`} type="button" className="btn btn-outline-secondary btn-sm">
              수정
            </button>,
          ];
        })}
      />
    </>
  );
}
