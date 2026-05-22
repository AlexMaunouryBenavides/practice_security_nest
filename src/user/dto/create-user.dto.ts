export class CreateUserDto {
  constructor(name: string, email: string, password: string) {
    this.name = name;
    this.email = email;
    this.password = password;
  }

  name: string;

  email: string;

  password: string;
}
