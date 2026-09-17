import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';
import { API } from '../../../core/constants/api.constants';
import { CreateUserDto, UpdateProfileDto, UserResponseDto } from '../../../core/models/usuario.model';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;

  const mockUsers: UserResponseDto[] = [
    {
      id: 1,
      dpi: '1000000000001',
      nombres: 'Carlos Raúl',
      apellidos: 'López Admin',
      correo: 'clp64413@gmail.com',
      rol: 'ADMIN',
      estado: true,
      telefono: '55550001',
    },
    {
      id: 2,
      dpi: '1000000000002',
      nombres: 'María José',
      apellidos: 'Castro Recepción',
      correo: 'maria.castro@gymdemo.com',
      rol: 'RECEPCIONISTA',
      estado: true,
      telefono: '55550002',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuariosService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener la lista de usuarios mediante GET /users', () => {
    service.getUsuarios().subscribe((usuarios) => {
      expect(usuarios.length).toBe(2);
      expect(usuarios[0].correo).toBe('clp64413@gmail.com');
      expect(usuarios[1].rol).toBe('RECEPCIONISTA');
    });

    const req = httpMock.expectOne(API.usuarios);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('debe crear un usuario mediante POST /users', () => {
    const dto: CreateUserDto = {
      dpi: '1000000000099',
      nombres: 'Entrenador',
      apellidos: 'Prueba',
      correo: 'coach.test@gymdemo.com',
      rol: 'ENTRENADOR',
      telefono: '55559999',
    };

    const creado: UserResponseDto = {
      id: 5,
      ...dto,
      estado: true,
      contraseniaTemporal: 'Temp123*',
    };

    service.crearUsuario(dto).subscribe((res) => {
      expect(res.id).toBe(5);
      expect(res.contraseniaTemporal).toBe('Temp123*');
    });

    const req = httpMock.expectOne(API.usuarios);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(creado);
  });

  it('debe obtener el perfil del usuario autenticado mediante GET /users/me', () => {
    service.getMiPerfil().subscribe((perfil) => {
      expect(perfil.id).toBe(1);
      expect(perfil.correo).toBe('clp64413@gmail.com');
    });

    const req = httpMock.expectOne(API.auth.perfil);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers[0]);
  });

  it('debe actualizar el perfil mediante PUT /users/me', () => {
    const updateDto: UpdateProfileDto = {
      nombres: 'Carlos Editado',
      apellidos: 'López',
      correo: 'clp64413@gmail.com',
    };

    service.actualizarMiPerfil(updateDto).subscribe((res) => {
      expect(res.nombres).toBe('Carlos Editado');
    });

    const req = httpMock.expectOne(API.auth.perfil);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockUsers[0], nombres: 'Carlos Editado' });
  });

  it('debe desactivar un usuario mediante DELETE /users/{id}', () => {
    service.desactivarUsuario(2).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${API.usuarios}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

