interface IGroup {
  name: string;
  creatorId: string;
  members: [{type: string}];
  createdAt: Date;
  updatedAt: Date;
}

//create group DTO
interface ICreateGroupDTO {
    name: string; 
    members: string[] | null;
    creatorId: string;

}
