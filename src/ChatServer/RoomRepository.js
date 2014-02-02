var method = RoomRepository.prototype;

function RoomRepository() {

    this.rooms = [
        {id: '9a0b8c609d063064725206ef3db743f3d98bb205', users: [], name: 'Lounge'},
        {id: '1480670592b29fd69505df084f9f022c8d0b5828', users: [], name: 'Development'}
    ];
}

method.getAll = function(){
    return this.rooms;
};

method.getById = function(id){
    for(var i=0; i < this.rooms.length; i++){
        if(this.rooms[i].id === id){
            return this.rooms[i];
        }
    }
    return null;
};


module.exports = RoomRepository;