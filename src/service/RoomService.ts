export namespace RoomService {
    let rooms: Room[] = [];

    export function getRooms() {
        return rooms;
    }

    export function createRoom(roomId: string) {
        rooms.push(new Room(roomId));
    }

    export function deleteAllRoom() {
        rooms = [];
    }
}

class Room {
    private members: RoomGameUserInfo[] = [];
    private chats: { userId: number; data: string }[] = [];

    constructor(public roomId: string) {}

    addChat(userId: number, data: string) {
        // create
        //db logic

        this.chats.push({ userId: userId, data: data });
    }

    deleteChat(chat: string) {
        //delete
        this.chats.splice(
            this.chats.findIndex((v) => v.data == chat),
            1
        );
    }

    getChats() {
        // read
        return this.chats;
    }

    getChatFromUserId(
        userId: number // read
    ) {
        return this.chats.filter((v) => v.userId == userId);

        // let newChat = []
        // for(const chat of this.chats) {
        //     if(chat.userId == userId) {
        //         newChat.push(chat)
        //     }
        // }

        // return newChat
    }
}
/**
 * 방들은 메모리에 저장
 * 방들에 대해 접근 가능한 메소드들 제공
 *
 * typescript는 조금 복잡한 데이터를 다룰때 타입을 정해두고 사용하면 편함
 * @types 파일에 그러한 타입들을 몰아둠으로써 관심사의 독립
 *
 * routes에서 모든 일을 처리하면 하나의 파일이 클라이언트와 소통, 메모리 관리, db와 소통이라는 세가지 일을 떠맡아
 * 코드가 복잡해질 가능성이 있음
 *
 * 이를 방지하기 위해 db와 소통하고 메모리를 관리하는 일을 RoomService라는 파일을 분리시켜 만듦
 *
//  * db와 소통한다라는 것은 기본적으로 crd라u는 시스템을 만드는것부터 시작
//  * 여기서 필요에 따라 복잡한 기능(ex 랭킹, 특정 방에게만 crud, 시간차 작업) 등을 추가해나가는 것이 아영님이 맡게 될 일
 * 그러나 방은 db에 저장하지 않고 램에만 저장할 것이기에 로그정도만 다룰 가능성이 있음
 * 램에서만 존재하는 방이더라도 기본적인 crud를 구현해서 외부에 제공해야함
 *
 * GameService를 보면 메소드들을 구현할때 순조로운데 GameService에서는 방들 저장을 맡고있지 않고 SocketService에 위임하고 있음
 * 이는 추후에 아키텍쳐가 더 나아보이면 GameService에 위임할 수도 있음
 *
 * 우리가 만들 방이라는 개념은 멤버들이 속해있고, 멤버들은 각자 권한을 가지고 있음. 또한 채팅들이 방에 저장되고 늦게 들어온 사람에게도 채팅이 보여야함
 * 방에 저장될 정보 :
 * roomId(외부에서는 이 식별자를 통해 방에 대한 정보에 접근함)
 * 멤버들 정보(이 정보에 대한 타입은 이미 구현되어 있음) + 권한  -> 타입 인터섹트를 통해 확장된 타입을 만듦.
 * 채팅 (단순한 string 배열)
 *
 * 여기서 생각을 해보면, 방이라는 데이터는 단순히 타입으로 지정해도되지만, 멤버들 권한 변경이나 채팅에 대한 조작등 자체적으로 여러 기능을 방 자체가 가지면 좋을 수 있음.
 * 이처럼 데이터 자체가 데이터의 복잡한 변경등의 인터페이스를 제공해야 할 때 class로 따로 만들 필요가 있음.
 *
 * 그러면 이런식으로 데이터 흐름이 흘러가게됨
 * 외부 -> namespace RoomService의 함수 이용 -> class Room의 메소드 이용
 *
 * 즉 RoomService는 방의 제작, 방들 보여주기, 방 삭제만 기능을 담당하도록 하고 방 내부 정보에 대한 조작은 맡지 않고 방에게 그 기능을 위임함
 *
 *
 */
