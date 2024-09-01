export namespace Util {
    export function userNameValidator(userName?: string) {
        if (!userName || typeof userName !== "string")
            return { success: false, errMsg: "유저네임은 문자열이여야 합니다." };
        if (userName.length == 0) return { success: false, errMsg: "유저네임은 빈 문자열일수 없습니다." };
        if (userName.length < 15) return { success: false, errMsg: "유저네임은 15글자 이하여야 합니다." };

        return { success: true };
    }

    export function phoneNumberValidator(phoneNumber: string) {
        if (!phoneNumber || typeof phoneNumber !== "string")
            return { success: false, errMsg: "휴대폰번호는 문자열이여야 합니다." };
        return { success: true };
    }
}
