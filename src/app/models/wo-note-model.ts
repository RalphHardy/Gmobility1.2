export const c_noteTagOptions = ['Report-Symptom', 'Report-Cause', 'Report-Action', 'Report-Other'];

export class WoNoteModel {
    constructor(
        public NoteLinkedToRecType: string,
        public NoteLinkedToRecId: number,
        public NoteTags: string,
        public NotePriority: boolean,
        public NoteText: string,

        public UserId: number,
        public UserName: string,
        public UserFullName: string,
        public CreatedDateTime: string,
        public MobLineId: number,
        
        public MobDispSeq: string
    ) {}
}