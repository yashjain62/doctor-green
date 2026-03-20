import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <div className="app-bg">
      <Navbar />
      <div className="page-container">{children}</div>
      <Footer />
    </div>
  );
}

export default Layout;
