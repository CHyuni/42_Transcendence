from django.core.exceptions import ValidationError
from bleach import clean
from bleach.sanitizer import ALLOWED_TAGS, ALLOWED_ATTRIBUTES

class HTMLSanitizerValidator:
    
    # 허용 정책 (프로젝트 요구사항에 맞게 수정)
    allowed_tags = ALLOWED_TAGS
    allowed_attributes = ALLOWED_ATTRIBUTES
    allowed_protocols = ['http', 'https']

    def __init__(self, tags=None, attributes=None, protocols=None):
        self.tags = tags or self.allowed_tags
        self.attributes = attributes or self.allowed_attributes
        self.protocols = protocols or self.allowed_protocols

    def __call__(self, value):
        sanitized_value = clean(
            value,
            tags=self.tags,
            attributes=self.attributes,
            protocols=self.protocols,
            strip=True,  # 허용되지 않은 태그/속성 완전 제거
            strip_comments=True
        )

        if sanitized_value != value:
            raise ValidationError(
                "허용되지 않은 HTML 요소가 포함되어 있습니다",
                code='xss_attempt'
            )
        return sanitized_value