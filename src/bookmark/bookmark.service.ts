import { ForbiddenException, Injectable } from '@nestjs/common';
import { stringify } from 'querystring';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
    constructor(private prisma: PrismaService) {}
    
    getBookmarks(userId: string) {
        return this.prisma.bookmark.findMany({
            where: {
                userId,
            }
        });
    }
    
    getBookmarkById(userId: string, bookmarkId: string) {
        return this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId,
            },
        });
    }
    
    async createBookmark(userId: string, dto: CreateBookmarkDto) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...dto
            }
        });

        return bookmark;
    }
    
   async editBookmarkById(userId: string, bookmarkId: string, dto: EditBookmarkDto) {
        //get the bookmark by id
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            },
        });
        //check if user owns bookmark
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource denied');
        }

        //modify bookmark

        return this.prisma.bookmark.update({
            where: {
                id: bookmarkId
            },
            data: {
                ...dto,
            },
        });
    }

    async deleteBookmarkById(userId: string, bookmarkId: string) {
        //get the bookmark by id
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            },
        });
        //check if user owns bookmark
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource denied');
        }

        //delete bookmark

        await this.prisma.bookmark.delete({
            where: {
                id: bookmarkId
            }
        });
    }
}
