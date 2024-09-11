export namespace Util {
    export function userNameValidator(userName?: string): CallbackResponse {
        if (!userName || typeof userName !== "string")
            return { success: false, errMsg: "유저네임은 문자열이여야 합니다." };
        if (userName.length == 0) return { success: false, errMsg: "유저네임은 빈 문자열일수 없습니다." };
        if (userName.length > 15) return { success: false, errMsg: "유저네임은 15글자 이하여야 합니다." };

        return { success: true };
    }

    export function phoneNumberValidator(phoneNumber: string): CallbackResponse<{ result: string }> {
        const rule = /^(01[016789]{1})?[0-9]{3,4}?[0-9]{4}$/;
        if (!phoneNumber || typeof phoneNumber !== "string")
            return { success: false, errMsg: "휴대폰번호는 문자열이여야 합니다." };
        //if (!phoneRule.test(phoneNumber)) return { success: false, errMsg: "전화번호가 올바르지 않습니다." };
        if (!rule.test(phoneNumber)) return { success: false, errMsg: "전화번호가 올바르지 않습니다." };
        return { success: true, result: "132" };
    }
}
