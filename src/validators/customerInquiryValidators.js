const { z } = require('./index');

const nonBlankString = z.string().trim().min(1);

const caseInquiryValidator = {
  body: z.object({
    caseNo: nonBlankString,
    mobile: nonBlankString
  }).strict()
};

const lineCaseInquiryValidator = {
  body: z.object({
    channelCode: nonBlankString,
    caseNo: nonBlankString,
    lineUserId: nonBlankString
  }).strict()
};

module.exports = {
  caseInquiryValidator,
  lineCaseInquiryValidator
};
