"""カスタムエラー定義"""

from fastapi import HTTPException, status


class AuthError(HTTPException):
    """認証エラー（401）"""

    def __init__(self, detail: str = "認証に失敗しました"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ValidationError(HTTPException):
    """バリデーションエラー（400）"""

    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class NotFoundError(HTTPException):
    """リソース未検出エラー（404）"""

    def __init__(self, detail: str = "リソースが見つかりません"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ForbiddenError(HTTPException):
    """権限エラー（403）"""

    def __init__(self, detail: str = "アクセス権限がありません"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class InstagramError(HTTPException):
    """Instagram連携エラー（502）"""

    def __init__(self, detail: str = "Instagram操作に失敗しました"):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)
