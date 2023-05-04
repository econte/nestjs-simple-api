import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { inspect } from 'util';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    })),

    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });
  
  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'teste@teste.com',
      password: '123'
    };

    describe('SignUp', () => {
      it('should throw if email empty', () => {
        return pactum.spec().post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw if password empty', () => {
        return pactum.spec().post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw body empty', () => {
        return pactum.spec().post('/auth/signup')
          .expectStatus(400);
      });
      
      it('should signup', () => {
        return pactum.spec().post('/auth/signup')
        .withBody(dto)
        .expectStatus(201);
      });
    });
    
    describe('SignIn', () => {
      it('should throw if email empty', () => {
        return pactum.spec().post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw if password empty', () => {
        return pactum.spec().post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw body empty', () => {
        return pactum.spec().post('/auth/signin')
          .expectStatus(400);
      });
      
      it('should signin', () => {
        return pactum.spec().post('/auth/signin')
        .withBody(dto)
        .expectStatus(200)
        .stores('userAccessToken', 'access_token');
      });
    });

  });
  
  describe('User', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum.spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(200);
      });
    });
    
    describe('Edit User', () => {
      it('should edit the current user', () => {
        
        const dto: EditUserDto = {
          firstName: "Endrigo",
          email: "endrigo@mail.com"
        };
        
        return pactum.spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });  
    });
  });

  describe('Bookmarks', () => {
    describe('Get Empty Bookmarks', () => {
      it('should return empty bookmarks', () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });
    
    describe('Get Bookmark', () => {});

    describe('Create Bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Google',
        link: 'google.com'
      }
      it('should create bookmark', () => {
        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
        });
      });

    describe('Get Bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(200)
          .expectJsonLength(1);
        });
    });

    describe('Get Bookmark by Id', () => {
      it('should get bookmark by id', () => {
        return pactum.spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
        });
    });

    describe('Edit Bookmark by Id', () => {
      
      const dto: EditBookmarkDto = {
        description: 'From Google.com\`s website', 
      }
      
      it('should edit bookmark', () => {
        return pactum.spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(200)
          .expectBodyContains(dto.description);
        });
    });

    describe('Delete Bookmark by Id', () => {
      it('should delete bookmark', () => {
        
        return pactum.spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}'
          })
          .expectStatus(204);
      });

    });

    it('should get empty bookmarks', () => {  
      return pactum.spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAccessToken}'
        })
        .expectStatus(200)
        .expectJsonLength(0);
      });

  });
});