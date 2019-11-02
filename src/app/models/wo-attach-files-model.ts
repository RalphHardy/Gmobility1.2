export class WoAttachFilesModel {
    constructor(
        public WOAttachFileID: number,
        public WorkOrderID: number,
        public FileName: string,
        public TransferToEnt: boolean, // default false
        public MobLineId: number,
        public MobDispSeq: string
    ) {}
}

export class AttachFilesLsoModel {
    constructor(
        public MobLineId: number, // attachment line id
        public MobDispSeq: string,
        public TransferToEnt: boolean, // not used

        public RetrievedFromServer: boolean, // default false
        public Need2Send2Server: boolean, // default false
        public WoNumber: string,
        public FileName: string, // only filename, not directory
        public DeviceDirName: string, // only directory path, ending in "/"
        public FilePathName: string, // full path name to local file on device
        public UrlPathName: string // used for accessing images (e.g., [src]=...)
    ) {}
}

export class DeviceImagesLsoModel {
    constructor(
        public ImageName: string, // includes suffix (e.g., .jpg, .png, .pdf)
        public DeviceDirName: string, // only directory path, ending in "/"
        public FilePathName: string, // full path name to local file on device
        public UrlPathName: string // used for accessing images (e.g., [src]=...)
    ) {}
}