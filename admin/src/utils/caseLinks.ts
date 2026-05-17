type CaseIdentifierInput = {
  caseId?: string | null;
  caseNo?: string | null;
};

type CaseDetailUrlInput = CaseIdentifierInput & {
  preserveCaseNo?: boolean;
};

export type CaseLinkAvailability = {
  href: string | null;
  mode: 'detail' | 'filter' | 'unavailable';
  label: string;
  reason?: string;
};

function normalizeIdentifier(value?: string | null) {
  const trimmed = value?.trim() || '';
  return trimmed || null;
}

function casesUrl(params: URLSearchParams) {
  const query = params.toString();
  return `/cases${query ? `?${query}` : ''}`;
}

export function buildCaseDetailUrl(input: CaseDetailUrlInput) {
  const caseId = normalizeIdentifier(input.caseId);
  const caseNo = normalizeIdentifier(input.caseNo);
  const params = new URLSearchParams();

  if (caseId) {
    if (input.preserveCaseNo && caseNo) {
      params.set('caseNo', caseNo);
    }
    params.set('caseId', caseId);
    return casesUrl(params);
  }

  if (caseNo) {
    params.set('caseNo', caseNo);
    return casesUrl(params);
  }

  return null;
}

export function buildCaseFilterUrl(input: Pick<CaseIdentifierInput, 'caseNo'>) {
  const caseNo = normalizeIdentifier(input.caseNo);
  const params = new URLSearchParams();

  if (caseNo) {
    params.set('caseNo', caseNo);
  }

  return casesUrl(params);
}

export function getCaseLinkAvailability(input: CaseIdentifierInput): CaseLinkAvailability {
  const caseId = normalizeIdentifier(input.caseId);
  const caseNo = normalizeIdentifier(input.caseNo);
  const href = buildCaseDetailUrl({ caseId, caseNo });

  if (caseId) {
    return {
      href,
      mode: 'detail',
      label: '查看案件'
    };
  }

  if (caseNo) {
    return {
      href,
      mode: 'filter',
      label: '依案件編號查看'
    };
  }

  return {
    href: null,
    mode: 'unavailable',
    label: '缺少案件識別資料',
    reason: '缺少 caseId 與 caseNo'
  };
}
