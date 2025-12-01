import logo from "../assets/logo.jpg";

function Header() {
  return (
    <nav className="navbar navbar-dark bg-dark p-2">
      <h1 className="navbar-brand">Hamamatsu UV Controller</h1>
      <a className="navbar-brand">
        <img src={logo} width={100} />
      </a>
    </nav>
  );
}

export default Header;
