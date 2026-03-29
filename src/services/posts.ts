
import { PostInput } from "@/types/types";

type StorageInput = {
  fileName: string;
  fileExtension: string;
  fileBuffer: Uint8Array;
};

type Paginationinput = {
  cursor?: string;
  limit?: number;
}

export const fetchPosts = async (pageParams: Paginationinput) => {
 

}

export const uploadVideoToStorage = async (storageProps: StorageInput) => {
  const { fileName, fileExtension, fileBuffer } = storageProps;

}

export const createPost = async (newPosts: PostInput) => {
 
}